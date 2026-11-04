import Foundation
import CoreBluetooth

/// 尚未被 JS ack 的量測（UserDefaults）。先存再通知，WebView 重載或背景時不遺失。
final class IghPendingStore {
    private let key = "igh_ble_pending_readings"

    func add(_ r: [String: Any]) {
        var arr = all()
        arr.append(r)
        if arr.count > 200 { arr.removeFirst(arr.count - 200) }
        UserDefaults.standard.set(arr, forKey: key)
    }

    @discardableResult
    func ack(_ id: String) -> Bool {
        let arr = all()
        let out = arr.filter { ($0["id"] as? String) != id }
        UserDefaults.standard.set(out, forKey: key)
        return out.count != arr.count
    }

    func all() -> [[String: Any]] {
        (UserDefaults.standard.array(forKey: key) as? [[String: Any]]) ?? []
    }
}

/// 單一設備的一次連線（與 Android GattSession.kt 同樣的流程與逾時）。
/// CoreBluetooth 所有回呼都在 IghBleCentral 的序列 queue 上，沒有競態。
final class IghGattSession: NSObject, CBPeripheralDelegate {

    let peripheral: CBPeripheral
    let name: String
    var address: String { peripheral.identifier.uuidString }   // 與 cordova-plugin-bluetoothle 的 iOS address 相同

    private let queue: DispatchQueue
    private let proto: EtbProtocol
    private weak var central: IghBleCentral?
    private var characteristic: CBCharacteristic?
    private var writeQueue: [(Data, String, (() -> Void)?)] = []
    private var writing: (Data, String, (() -> Void)?)? = nil
    private var timers: [String: DispatchWorkItem] = [:]
    private var rediscovered = false
    private(set) var gotReading = false
    private(set) var finished = false
    private var disconnecting = false

    static let connectTimeout = 12.0
    static let discoverTimeout = 12.0
    static let opTimeout = 5.0
    static let sessionTimeout = 60.0
    static let powerOffDisconnectDelay = 2.0
    static let powerOffFallback = 4.0

    init(peripheral: CBPeripheral, name: String, model: EtbProtocol.Model, queue: DispatchQueue, central: IghBleCentral) {
        self.peripheral = peripheral
        self.name = name
        self.queue = queue
        self.proto = EtbProtocol(model: model)
        self.central = central
        super.init()
        peripheral.delegate = self
    }

    func start(manager: CBCentralManager) {
        central?.sessionEvent(self, type: "connecting", message: "連線中 \(name)")
        startTimer("session", Self.sessionTimeout) { [weak self] in self?.finish(false, "整體逾時") }
        startTimer("connect", Self.connectTimeout) { [weak self] in self?.finish(false, "連線逾時") }
        manager.connect(peripheral, options: nil)
    }

    // 由 IghBleCentral 轉呼叫
    func didConnect() {
        cancelTimer("connect")
        central?.sessionEvent(self, type: "connected", message: "已連線 \(name)")
        startTimer("discover", Self.discoverTimeout) { [weak self] in self?.finish(false, "Discover 逾時") }
        peripheral.discoverServices([CBUUID(string: EtbProtocol.serviceUUID)])
    }

    func didFailOrDisconnect(_ error: Error?) {
        if disconnecting { finish(gotReading, "正常斷線") }
        else { finish(gotReading, "斷線 \(error?.localizedDescription ?? "")") }
    }

    func abort(_ reason: String) { finish(false, reason) }

    // MARK: CBPeripheralDelegate

    func peripheral(_ p: CBPeripheral, didDiscoverServices error: Error?) {
        if finished { return }
        guard let svc = p.services?.first(where: { $0.uuid == CBUUID(string: EtbProtocol.serviceUUID) }) else {
            // iOS 無法清 GATT 快取：重新 discover 一次，仍失敗則交給退避
            if !rediscovered {
                rediscovered = true
                central?.sessionEvent(self, type: "log", message: "找不到 FFF0，重新 discover")
                queue.asyncAfter(deadline: .now() + 0.6) { [weak self] in
                    guard let s = self, !s.finished else { return }
                    s.peripheral.discoverServices([CBUUID(string: EtbProtocol.serviceUUID)])
                }
                return
            }
            finish(false, "Service not found")
            return
        }
        p.discoverCharacteristics([CBUUID(string: EtbProtocol.charUUID)], for: svc)
    }

    func peripheral(_ p: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if finished { return }
        guard let chr = service.characteristics?.first(where: { $0.uuid == CBUUID(string: EtbProtocol.charUUID) }) else {
            finish(false, "Characteristic not found"); return
        }
        cancelTimer("discover")
        characteristic = chr
        startTimer("op", Self.opTimeout) { [weak self] in self?.finish(self?.gotReading ?? false, "訂閱逾時") }
        p.setNotifyValue(true, for: chr)
    }

    func peripheral(_ p: CBPeripheral, didUpdateNotificationStateFor c: CBCharacteristic, error: Error?) {
        if finished { return }
        cancelTimer("op")
        if let e = error { finish(false, "訂閱失敗 \(e.localizedDescription)"); return }
        central?.sessionEvent(self, type: "subscribed", message: "訂閱成功")
        run(proto.onSubscribed())
    }

    func peripheral(_ p: CBPeripheral, didUpdateValueFor c: CBCharacteristic, error: Error?) {
        if finished { return }
        guard error == nil, let v = c.value else { return }
        run(proto.onNotify([UInt8](v)))
    }

    func peripheral(_ p: CBPeripheral, didWriteValueFor c: CBCharacteristic, error: Error?) {
        guard let w = writing else { return }
        writing = nil
        cancelTimer("op")
        if finished { return }
        if let e = error {
            if let then = w.2 { then(); return } // 關機指令失敗視同完成
            finish(gotReading, "寫入失敗 \(e.localizedDescription)")
            return
        }
        w.2?()
        nextWrite()
    }

    // MARK: 協定動作

    private func run(_ actions: [EtbProtocol.Action]) {
        for a in actions {
            if finished { return }
            switch a {
            case .write(let d, let label):
                enqueueWrite(d, label, nil)
            case .startTimer(let tag, let ms):
                startTimer("p:" + tag, Double(ms) / 1000.0) { [weak self] in
                    guard let s = self else { return }
                    s.run(s.proto.onTimer(tag))
                }
            case .cancelTimer(let tag):
                cancelTimer("p:" + tag)
            case .emit(let r):
                gotReading = true
                central?.reading(self, r)
            case .powerOffAndFinish(let d):
                enqueueWrite(d, "PowerOff") { [weak self] in
                    self?.queue.asyncAfter(deadline: .now() + Self.powerOffDisconnectDelay) { self?.disconnect() }
                }
                startTimer("poweroff", Self.powerOffFallback) { [weak self] in self?.disconnect() }
            case .fail(let reason):
                finish(gotReading, reason)
            case .log(let m):
                central?.sessionEvent(self, type: "log", message: m)
            }
        }
    }

    private func enqueueWrite(_ d: Data, _ label: String, _ then: (() -> Void)?) {
        writeQueue.append((d, label, then))
        if writing == nil { nextWrite() }
    }

    private func nextWrite() {
        guard !finished, writing == nil, !writeQueue.isEmpty, let c = characteristic else { return }
        let w = writeQueue.removeFirst()
        if c.properties.contains(.write) {
            writing = w
            startTimer("op", Self.opTimeout) { [weak self] in self?.finish(self?.gotReading ?? false, "寫入逾時 \(w.1)") }
            peripheral.writeValue(w.0, for: c, type: .withResponse)
        } else {
            peripheral.writeValue(w.0, for: c, type: .withoutResponse)
            w.2?()
            queue.async { [weak self] in self?.nextWrite() }
        }
    }

    private func disconnect() {
        if finished || disconnecting { return }
        disconnecting = true
        central?.cancelConnection(peripheral)
        startTimer("disconnect", 2.0) { [weak self] in self?.finish(self?.gotReading ?? false, "斷線（逾時保底）") }
    }

    private func finish(_ success: Bool, _ reason: String) {
        if finished { return }
        finished = true
        timers.values.forEach { $0.cancel() }
        timers.removeAll()
        writeQueue.removeAll()
        writing = nil
        central?.cancelConnection(peripheral)
        central?.sessionFinished(self, success: success, reason: reason)
    }

    private func startTimer(_ tag: String, _ seconds: Double, _ block: @escaping () -> Void) {
        cancelTimer(tag)
        let item = DispatchWorkItem { [weak self] in
            guard let s = self, !s.finished else { return }
            s.timers[tag] = nil
            block()
        }
        timers[tag] = item
        queue.asyncAfter(deadline: .now() + seconds, execute: item)
    }

    private func cancelTimer(_ tag: String) {
        timers.removeValue(forKey: tag)?.cancel()
    }
}

/// 掃描 + 自動連線總控（對應 Android BleCentral.kt）。
final class IghBleCentral: NSObject, CBCentralManagerDelegate {

    struct Config {
        var deviceNames: Set<String> = ["ETB04", "ETB05"]
        var autoConnect = true
        var forcePair = false
        var pairedAddresses: Set<String> = []
    }

    let queue = DispatchQueue(label: "tw.com.ethink.ighble")
    let pending = IghPendingStore()
    private var manager: CBCentralManager!
    private let emit: ([String: Any]) -> Void
    private var config = Config()
    private var scanWanted = false
    private var session: IghGattSession?
    private let cooldown = DeviceCooldown()
    private var reportedUnpaired = Set<String>()
    private var lastReport: [String: TimeInterval] = [:]

    init(emit: @escaping ([String: Any]) -> Void) {
        self.emit = emit
        super.init()
        manager = CBCentralManager(delegate: self, queue: queue, options: [
            CBCentralManagerOptionShowPowerAlertKey: false,
            CBCentralManagerOptionRestoreIdentifierKey: "tw.com.ethink.ighble.central",
        ])
    }

    private var now: TimeInterval { ProcessInfo.processInfo.systemUptime }

    func configure(_ c: Config) { queue.async { self.config = c } }

    func startScan() {
        queue.async {
            self.scanWanted = true
            self.reportedUnpaired.removeAll()
            self.startScanInternal()
        }
    }

    func stopScan() {
        queue.async {
            self.scanWanted = false
            if self.manager.isScanning { self.manager.stopScan() }
            self.emitState()
        }
    }

    func state() -> [String: Any] {
        var auth = "unknown"
        if #available(iOS 13.1, *) {
            switch CBManager.authorization {
            case .allowedAlways: auth = "granted"
            case .denied, .restricted: auth = "denied"
            case .notDetermined: auth = "notDetermined"
            @unknown default: auth = "unknown"
            }
        }
        return ["type": "state", "enabled": manager.state == .poweredOn, "hasBle": manager.state != .unsupported,
                "permission": auth == "granted", "authorization": auth,
                "scanning": manager.isScanning, "busy": session != nil]
    }

    func emitState() { emit(state()) }

    private func startScanInternal() {
        guard manager != nil, scanWanted, session == nil, manager.state == .poweredOn, !manager.isScanning else { return }
        // allowDuplicates：原 JS 註解指出 iOS 若為 false，設備只會被掃到一次
        manager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
        log("開始掃描 \(config.deviceNames.sorted())")
        emitState()
    }

    // MARK: CBCentralManagerDelegate

    func centralManagerDidUpdateState(_ c: CBCentralManager) {
        if c.state == .poweredOn {
            startScanInternal()
        } else {
            session?.abort("藍牙已關閉")
        }
        emitState()
    }

    func centralManager(_ c: CBCentralManager, willRestoreState dict: [String: Any]) {
        // 不沿用被系統還原的舊連線，避免殭屍連線
        if let ps = dict[CBCentralManagerRestoredStatePeripheralsKey] as? [CBPeripheral] {
            ps.forEach { c.cancelPeripheralConnection($0) }
        }
    }

    func centralManager(_ c: CBCentralManager, didDiscover p: CBPeripheral, advertisementData ad: [String: Any], rssi: NSNumber) {
        guard let name = (ad[CBAdvertisementDataLocalNameKey] as? String) ?? p.name, config.deviceNames.contains(name) else { return }
        let id = p.identifier.uuidString
        let report = { self.emit(["type": "scanResult", "name": name, "address": id, "rssi": rssi]) }
        // 非自動連線（配對頁面列出設備）：同一台 3 秒內只回報一次
        if !config.autoConnect {
            if (lastReport[id] ?? 0) + 3 < now { lastReport[id] = now; report() }
            return
        }
        guard session == nil else { return }
        if config.forcePair && !config.pairedAddresses.contains(id.uppercased()) {
            if reportedUnpaired.insert(id).inserted { emitError("Err004", name, name, id) }
            return
        }
        guard !cooldown.isBlocked(id, now: now), let model = EtbProtocol.model(of: name) else { return }
        report() // 自動連線模式：只在真的要連線時回報
        c.stopScan()
        let s = IghGattSession(peripheral: p, name: name, model: model, queue: queue, central: self)
        session = s
        emitState()
        s.start(manager: c)
    }

    func centralManager(_ c: CBCentralManager, didConnect p: CBPeripheral) {
        if let s = session, s.peripheral.identifier == p.identifier { s.didConnect() }
        else { c.cancelPeripheralConnection(p) }
    }

    func centralManager(_ c: CBCentralManager, didFailToConnect p: CBPeripheral, error: Error?) {
        if let s = session, s.peripheral.identifier == p.identifier { s.didFailOrDisconnect(error) }
    }

    func centralManager(_ c: CBCentralManager, didDisconnectPeripheral p: CBPeripheral, error: Error?) {
        if let s = session, s.peripheral.identifier == p.identifier { s.didFailOrDisconnect(error) }
    }

    // MARK: session 回呼（皆在 queue 上）

    func cancelConnection(_ p: CBPeripheral) {
        if p.state == .connected || p.state == .connecting { manager.cancelPeripheralConnection(p) }
    }

    func sessionEvent(_ s: IghGattSession, type: String, message: String) {
        log("[\(s.name)] \(message)")
        if type != "log" { emit(["type": type, "name": s.name, "address": s.address, "message": message]) }
    }

    func reading(_ s: IghGattSession, _ r: EtbProtocol.Reading) {
        let o: [String: Any] = [
            "type": "reading", "id": UUID().uuidString, "model": r.model, "name": s.name, "address": s.address,
            "kind": r.kind, "value": r.value, "bgType": r.bgType,
            "measuredAt": Int64(Date().timeIntervalSince1970 * 1000),
        ]
        pending.add(o) // 先存再通知
        emit(o)
    }

    func sessionFinished(_ s: IghGattSession, success: Bool, reason: String) {
        guard session === s else { return }
        session = nil
        if success {
            cooldown.markSuccess(s.address, now: now)
        } else {
            let b = cooldown.markFailure(s.address, now: now)
            log("[\(s.name)] 失敗：\(reason)，\(Int(b))s 內不重連（第 \(cooldown.failureCount(s.address)) 次）")
            emitError("Err005", reason, s.name, s.address)
        }
        emit(["type": "disconnected", "name": s.name, "address": s.address, "success": success, "reason": reason])
        emitState()
        // 原 JS：iOS close 後休息 3 秒再掃描
        queue.asyncAfter(deadline: .now() + 3) { [weak self] in self?.startScanInternal() }
    }

    private func emitError(_ code: String, _ message: String, _ name: String?, _ address: String?) {
        emit(["type": "error", "code": code, "message": message,
              "name": name.map { $0 as Any } ?? NSNull(), "address": address.map { $0 as Any } ?? NSNull()])
    }

    private func log(_ m: String) {
        NSLog("IghBle %@", m)
        emit(["type": "log", "message": m])
    }
}
