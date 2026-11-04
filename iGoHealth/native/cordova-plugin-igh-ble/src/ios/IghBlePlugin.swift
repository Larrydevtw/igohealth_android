import Foundation
import CoreBluetooth
import UIKit

/// Cordova 介面，與 Android IghBlePlugin.kt 相同（見 www/ighBle.js）。
/// 需要專案的 Bridging-Header 匯入 <Cordova/CDV.h>（cordova-ios 7 範本預設已有）。
@objc(IghBlePlugin)
class IghBlePlugin: CDVPlugin {

    private var central: IghBleCentral?
    private var listenerId: String?

    override func pluginInitialize() {
        super.pluginInitialize()
        central = IghBleCentral { [weak self] evt in self?.send(evt) }
    }

    private func send(_ evt: [String: Any]) {
        guard let id = listenerId else { return }
        let r = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: evt)
        r?.setKeepCallbackAs(true)
        commandDelegate.send(r, callbackId: id)
    }

    private func ok(_ cmd: CDVInvokedUrlCommand, _ payload: Any? = nil) {
        let r: CDVPluginResult?
        if let d = payload as? [String: Any] { r = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: d) }
        else if let a = payload as? [Any] { r = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: a) }
        else if let n = payload as? Int { r = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: Int32(n)) }
        else { r = CDVPluginResult(status: CDVCommandStatus_OK) }
        commandDelegate.send(r, callbackId: cmd.callbackId)
    }

    @objc(setListener:)
    func setListener(_ cmd: CDVInvokedUrlCommand) {
        listenerId = cmd.callbackId
        let r = CDVPluginResult(status: CDVCommandStatus_NO_RESULT)
        r?.setKeepCallbackAs(true)
        commandDelegate.send(r, callbackId: cmd.callbackId)
        central?.queue.async { [weak self] in
            guard let c = self?.central else { return }
            c.emitState()
            for var p in c.pending.all() { p["replayed"] = true; self?.send(p) }
        }
    }

    @objc(configure:)
    func configure(_ cmd: CDVInvokedUrlCommand) {
        let o = cmd.argument(at: 0) as? [String: Any] ?? [:]
        var c = IghBleCentral.Config()
        if let n = o["deviceNames"] as? [String], !n.isEmpty { c.deviceNames = Set(n) }
        c.autoConnect = o["autoConnect"] as? Bool ?? true
        c.forcePair = o["forcePair"] as? Bool ?? false
        c.pairedAddresses = Set((o["pairedAddresses"] as? [String] ?? []).map { $0.uppercased() })
        central?.configure(c)
        ok(cmd)
    }

    /// iOS 第一次建立 CBCentralManager 時系統就會詢問藍牙權限，這裡只回報狀態。
    @objc(requestPermissions:)
    func requestPermissions(_ cmd: CDVInvokedUrlCommand) {
        central?.queue.async { [weak self] in
            let st = self?.central?.state() ?? [:]
            let granted = (st["authorization"] as? String) != "denied"
            self?.ok(cmd, ["granted": granted])
        }
    }

    @objc(startScan:)
    func startScan(_ cmd: CDVInvokedUrlCommand) { central?.startScan(); ok(cmd) }

    @objc(stopScan:)
    func stopScan(_ cmd: CDVInvokedUrlCommand) { central?.stopScan(); ok(cmd) }

    @objc(ack:)
    func ack(_ cmd: CDVInvokedUrlCommand) {
        let id = cmd.argument(at: 0) as? String ?? ""
        let removed = central?.pending.ack(id) ?? false
        ok(cmd, removed ? 1 : 0)
    }

    @objc(getPending:)
    func getPending(_ cmd: CDVInvokedUrlCommand) { ok(cmd, central?.pending.all() ?? []) }

    @objc(getState:)
    func getState(_ cmd: CDVInvokedUrlCommand) {
        central?.queue.async { [weak self] in self?.ok(cmd, self?.central?.state() ?? [:]) }
    }

    /// iOS 無法由 App 直接開啟藍牙，改為開啟本 App 的設定頁
    @objc(enableBluetooth:)
    func enableBluetooth(_ cmd: CDVInvokedUrlCommand) { openSettings(); ok(cmd) }

    @objc(openBluetoothSettings:)
    func openBluetoothSettings(_ cmd: CDVInvokedUrlCommand) { openSettings(); ok(cmd) }

    private func openSettings() {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
        }
    }
}
