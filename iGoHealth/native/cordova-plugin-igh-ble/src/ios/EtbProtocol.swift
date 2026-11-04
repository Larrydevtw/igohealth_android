import Foundation

/// 聿新 Bioptik ETB04 / ETB05 協定（與 src/android/core/EtbProtocol.kt 一對一對應，修改時兩邊要同步）。
/// 不處理計時與藍牙 I/O，只回傳 Action，由 IghGattSession 執行。
final class EtbProtocol {

    enum Model: String { case ETB04, ETB05 }

    struct Reading: Equatable {
        let model: String
        /// G 血糖 / C 膽固醇 / U 尿酸 / H 血紅素 / T 三酸甘油脂 / P 血壓 / Err 設備錯誤碼 / NoData
        let kind: String
        let value: String
        var bgType: Int = 0
    }

    enum Action {
        case write(Data, label: String)
        case startTimer(String, ms: Int)
        case cancelTimer(String)
        case emit(Reading)
        case powerOffAndFinish(Data)
        case fail(String)
        case log(String)
    }

    static let serviceUUID = "FFF0"
    static let charUUID = "FFF1"

    static let cmdLink = Data([0x7B, 0x4C, 0x23, 0xEF, 0x7D])
    static let cmdType = Data([0x7B, 0x53, 0x23, 0xF0, 0x7D])
    static let cmdData = Data([0x7B, 0x44, 0x23, 0xE7, 0x7D])
    static let cmdPowerOff = Data([0x7B, 0x5A, 0x23, 0xF9, 0x7D])

    static let timerLink = "link"
    static let timerData = "data"
    static let firstLinkDelayMs = 1000
    static let linkRetryMs = 2000
    static let linkMaxTries = 15
    static let replyTimeoutMs = 5000
    static let replyMaxTries = 3

    static func model(of name: String?) -> Model? {
        guard let n = name else { return nil }
        return Model(rawValue: n)
    }

    /// 原 JS ETB_CheckSum
    static func checksum(_ frame: [UInt8]) -> Int? {
        var x: Int? = nil
        var i = 0
        while i < frame.count {
            let b = Int(frame[i])
            if b == 0x7B {
                i += 1
                if i < frame.count { x = Int(frame[i]) }
            } else if b == 0x23 {
                return ((x ?? 0) ^ b) | 0x80
            } else if let v = x {
                x = v ^ b
            }
            i += 1
        }
        return nil
    }

    /// JavaScript parseInt
    static func jsParseInt(_ s: String) -> Int? {
        let t = s.drop(while: { $0 == " " })
        var digits = ""
        var idx = t.startIndex
        if idx < t.endIndex, t[idx] == "-" || t[idx] == "+" { digits.append(t[idx]); idx = t.index(after: idx) }
        var any = false
        while idx < t.endIndex, t[idx].isASCII, t[idx].isNumber { digits.append(t[idx]); any = true; idx = t.index(after: idx) }
        return any ? Int(digits) : nil
    }

    /// JavaScript substr(start, length)
    static func substr(_ s: String, _ start: Int, _ length: Int) -> String {
        let chars = Array(s)
        if start >= chars.count { return "" }
        return String(chars[start..<min(chars.count, start + length)])
    }

    static func ascii(_ bytes: [UInt8]) -> String {
        String(String.UnicodeScalarView(bytes.map { Unicode.Scalar($0) }))
    }

    let model: Model
    private var rx: [UInt8] = []
    private var linked = false
    private var linkTries = 0
    private var thisType: String? = nil
    private var pending: String? = nil
    private var replyTries = 0
    private var finished = false

    init(model: Model) { self.model = model }

    func onSubscribed() -> [Action] {
        rx = []; linked = false; linkTries = 0; thisType = nil; pending = nil; replyTries = 0; finished = false
        return [.startTimer(Self.timerLink, ms: Self.firstLinkDelayMs)]
    }

    func onTimer(_ tag: String) -> [Action] {
        if finished { return [] }
        switch tag {
        case Self.timerLink:
            if linked { return [] }
            if linkTries >= Self.linkMaxTries { return fail("Link 無回應（已送 \(linkTries) 次）") }
            linkTries += 1
            return [.write(Self.cmdLink, label: "L#\(linkTries)"), .startTimer(Self.timerLink, ms: Self.linkRetryMs)]
        case Self.timerData:
            guard let cmd = pending else { return [] }
            if replyTries >= Self.replyMaxTries { return fail("指令 \(cmd) 無回應") }
            return send(cmd)
        default:
            return []
        }
    }

    func onNotify(_ chunk: [UInt8]) -> [Action] {
        if finished { return [] }
        var out: [Action] = []
        rx.append(contentsOf: chunk)
        while true {
            guard let start = rx.firstIndex(of: 0x7B) else { rx.removeAll(); break }
            if start > 0 { rx.removeFirst(start) }
            guard let end = rx.firstIndex(of: 0x7D) else { break }
            let frame = Array(rx[0...end])
            rx.removeFirst(end + 1)
            out += onFrame(frame)
            if finished { break }
        }
        return out
    }

    private func onFrame(_ frame: [UInt8]) -> [Action] {
        let text = Self.ascii(frame)
        if frame.count < 4 { return [.log("忽略過短封包 \(text)")] }
        switch frame[1] {
        case 0x4C: // L
            if linked { return [.log("重複的 L 回覆")] }
            linked = true
            return [.cancelTimer(Self.timerLink), .log("Link OK \(text)")] + send("S", reset: true)
        case 0x53: // S
            if pending != "S" { return [.log("非預期的 S 回覆 \(text)")] }
            thisType = Self.substr(text, 2, 1)
            return [.log("類型 \(thisType ?? "")")] + send("D", reset: true)
        case 0x44: // D
            if pending != "D" { return [.log("非預期的 D 回覆 \(text)")] }
            let ck = Self.checksum(frame)
            if ck == nil || ck! != Int(frame[frame.count - 2]) {
                if replyTries >= Self.replyMaxTries { return fail("CheckSum Error") }
                return [.log("CheckSum Error，重送 D")] + send("D")
            }
            finished = true
            pending = nil
            return [.cancelTimer(Self.timerData), .emit(parse(text)), .powerOffAndFinish(Self.cmdPowerOff)]
        default:
            return [.log("未知封包 \(text)")]
        }
    }

    /// 依原 JS getMeasurementData 解析（substr 位置完全一致）
    func parse(_ text: String) -> Reading {
        let m = model.rawValue
        let head = text.split(separator: "#", maxSplits: 1, omittingEmptySubsequences: false).first.map(String.init) ?? text
        if head.count == 4 {
            return Reading(model: m, kind: "Err", value: Self.substr(text, 2, 2))
        }
        func int(_ s: Int, _ l: Int) -> Int? { Self.jsParseInt(Self.substr(text, s, l)) }
        func tenth(_ s: Int, _ l: Int) -> String? { int(s, l).map { String(format: "%.1f", locale: Locale(identifier: "en_US_POSIX"), Double($0) / 10.0) } }
        var kind = ""
        var value: String? = nil
        switch model {
        case .ETB04:
            switch thisType {
            case "0":
                kind = "P"
                if let a = int(2, 3), let b = int(6, 3), let c = int(10, 3) { value = "\(a),\(b),\(c)" }
            case "1": kind = "G"; value = int(2, 4).map(String.init)
            case "2": kind = "C"; value = int(2, 4).map(String.init)
            default: break
            }
        case .ETB05:
            switch thisType {
            case "0": kind = "G"; value = int(3, 4).map(String.init)
            case "1": kind = "C"; value = int(3, 4).map(String.init)
            case "2": kind = "U"; value = tenth(3, 4)
            case "3": kind = "H"; value = tenth(3, 4)
            case "4": kind = "T"; value = int(3, 5).map(String.init)
            default: break
            }
        }
        guard let v = value else { return Reading(model: m, kind: "NoData", value: "") }
        return Reading(model: m, kind: kind, value: v)
    }

    private func send(_ cmd: String, reset: Bool = false) -> [Action] {
        if reset { replyTries = 0 }
        pending = cmd
        replyTries += 1
        let bytes = cmd == "S" ? Self.cmdType : Self.cmdData
        return [.write(bytes, label: "\(cmd)#\(replyTries)"), .startTimer(Self.timerData, ms: Self.replyTimeoutMs)]
    }

    private func fail(_ reason: String) -> [Action] {
        finished = true
        return [.cancelTimer(Self.timerLink), .cancelTimer(Self.timerData), .fail(reason)]
    }
}

/// 與 Android DeviceCooldown.kt 相同的冷卻 / 退避規則
final class DeviceCooldown {
    private let successCooldown: TimeInterval
    private let baseBackoff: TimeInterval
    private let maxBackoff: TimeInterval
    private var blockedUntil: [String: TimeInterval] = [:]
    private var failures: [String: Int] = [:]

    init(successCooldown: TimeInterval = 20, baseBackoff: TimeInterval = 2, maxBackoff: TimeInterval = 60) {
        self.successCooldown = successCooldown
        self.baseBackoff = baseBackoff
        self.maxBackoff = maxBackoff
    }

    func isBlocked(_ id: String, now: TimeInterval) -> Bool { (blockedUntil[id] ?? 0) > now }

    func markSuccess(_ id: String, now: TimeInterval) {
        failures[id] = nil
        blockedUntil[id] = now + successCooldown
    }

    @discardableResult
    func markFailure(_ id: String, now: TimeInterval) -> TimeInterval {
        let n = (failures[id] ?? 0) + 1
        failures[id] = n
        let delay = min(maxBackoff, baseBackoff * pow(2, Double(min(n - 1, 16))))
        blockedUntil[id] = now + delay
        return delay
    }

    func failureCount(_ id: String) -> Int { failures[id] ?? 0 }
}
