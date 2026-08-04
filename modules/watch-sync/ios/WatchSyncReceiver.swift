import Foundation
import WatchConnectivity

/// Recibe las sesiones que envía el Apple Watch embebido y las retiene hasta que la
/// liga las importa.
///
/// `transferUserInfo` se entrega aunque la app esté cerrada: iOS la despierta en
/// segundo plano. Por eso la cola vive en `UserDefaults` y no en JS — la sesión tiene
/// que sobrevivir a que React Native ni siquiera haya arrancado.
///
/// Es un singleton porque WatchConnectivity admite **un solo delegado** por proceso:
/// el subscriber de arranque lo activa y el módulo Expo lo consulta.
final class WatchSyncReceiver: NSObject {

    static let shared = WatchSyncReceiver()

    /// Aviso al módulo Expo cuando entra una sesión con la app abierta.
    var onSesionRecibida: ((_ sessionId: String, _ datos: String) -> Void)?

    private let defaults = UserDefaults.standard

    // El reloj construye el JSON del contrato (mismo cuerpo que el POST
    // /v1/padel-sessions de rising-padel-watch) y lo manda bajo `contractKey`;
    // `sessionIdKey` viaja aparte para poder deduplicar sin parsear.
    private static let sessionIdKey = "padel_session_id"
    private static let contractKey = "padel_session_contract"

    private static let pendientesKey = "watchSync.pendientes"
    private static let consumidasKey = "watchSync.consumidas"
    /// Con recordar las últimas basta: WatchConnectivity entrega cada transferencia una
    /// vez y este límite solo evita que la lista crezca para siempre.
    private static let maxConsumidasRecordadas = 200

    func activate() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// Cola pendiente, en orden de llegada. Cada entrada: `{"id": ..., "datos": ...}`.
    var pendientes: [[String: String]] {
        (defaults.array(forKey: Self.pendientesKey) as? [[String: String]]) ?? []
    }

    /// Saca una sesión de la cola y la recuerda como consumida para que un reenvío del
    /// reloj no la resucite.
    func consumir(_ sessionId: String) {
        let queda = pendientes.filter { $0["id"] != sessionId }
        defaults.set(queda, forKey: Self.pendientesKey)

        var vistas = defaults.stringArray(forKey: Self.consumidasKey) ?? []
        if !vistas.contains(sessionId) {
            vistas.append(sessionId)
            if vistas.count > Self.maxConsumidasRecordadas {
                vistas.removeFirst(vistas.count - Self.maxConsumidasRecordadas)
            }
            defaults.set(vistas, forKey: Self.consumidasKey)
        }
    }

    private func encolar(sessionId: String, datos: String) {
        let vistas = defaults.stringArray(forKey: Self.consumidasKey) ?? []
        guard !vistas.contains(sessionId) else { return }

        var cola = pendientes
        guard !cola.contains(where: { $0["id"] == sessionId }) else { return }
        cola.append(["id": sessionId, "datos": datos])
        defaults.set(cola, forKey: Self.pendientesKey)

        onSesionRecibida?(sessionId, datos)
    }
}

extension WatchSyncReceiver: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        guard let sessionId = userInfo[Self.sessionIdKey] as? String,
              let datos = userInfo[Self.contractKey] as? String else {
            return
        }
        // UserDefaults y el aviso a JS, siempre desde el hilo principal.
        DispatchQueue.main.async { [weak self] in
            self?.encolar(sessionId: sessionId, datos: datos)
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    /// Al cambiar de reloj hay que reactivar para seguir recibiendo sesiones del nuevo.
    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }
}
