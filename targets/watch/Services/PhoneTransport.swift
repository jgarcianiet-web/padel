import Foundation
import WatchConnectivity

/// Envía la sesión terminada al iPhone.
///
/// Se usa `transferUserInfo` y no `sendMessage` porque **encola**: si el iPhone está
/// apagado o fuera de alcance al acabar el partido, watchOS entrega la sesión cuando
/// vuelva a haber conexión. Un mensaje se perdería.
final class PhoneTransport: NSObject {

    private let session: WCSession = .default
    private let encoder = JSONEncoder()

    /// Sesiones que no se han podido encolar todavía (sin WCSession disponible).
    private(set) var pending: [PadelSession] = []

    /// Ajustes replicados desde el iPhone. Lo consume `SessionController`.
    var onSettingsReceived: ((DeviceSettings) -> Void)?

    func activate() {
        guard WCSession.isSupported() else { return }
        session.delegate = self
        session.activate()
        // Al activar puede haber un contexto pendiente de una edición hecha con el reloj
        // apagado: WatchConnectivity no lo reentrega por delegado, hay que leerlo.
        applyContext(session.receivedApplicationContext)
    }

    fileprivate func applyContext(_ context: [String: Any]) {
        guard let data = context[Self.settingsKey] as? Data,
              let settings = DeviceSettings.decode(data) else { return }
        onSettingsReceived?(settings)
    }

    /// - Returns: true si la sesión quedó encolada para entrega.
    @discardableResult
    func send(_ session: PadelSession) -> Bool {
        guard WCSession.isSupported(), self.session.activationState == .activated else {
            pending.append(session)
            return false
        }
        guard let data = try? encoder.encode(session) else { return false }
        // La clave lleva el sessionId: dos sesiones distintas no se pisan en la cola.
        var userInfo: [String: Any] = [
            Self.payloadKey: data,
            Self.sessionIdKey: session.sessionId,
        ]
        // La compañera es Liga Personal Pádel: consume el MISMO JSON que el cuerpo de
        // `POST /v1/padel-sessions` del contrato, ya convertido aquí, donde vive
        // PadelCore. Así su receptor no necesita el modelo de dominio. La salud solo se
        // mide con consentimiento, luego `shareHealth: true` no puede filtrar nada que
        // el usuario no aprobara. Sin eventos golpe a golpe: la liga usa agregados y
        // `transferUserInfo` tiene un límite práctico de tamaño.
        if let contract = Self.contractJSON(for: session) {
            userInfo[Self.contractKey] = contract
        }
        self.session.transferUserInfo(userInfo)
        return true
    }

    /// Reintenta lo que se quedó fuera por no tener WCSession lista.
    func flushPending() {
        guard !pending.isEmpty else { return }
        let queued = pending
        pending.removeAll()
        for session in queued {
            send(session)
        }
    }

    /// Envía el fichero de datos de entrenamiento al iPhone.
    ///
    /// `transferFile` y no `transferUserInfo` porque el fichero puede pesar decenas de
    /// megas: es la señal cruda de miles de golpeos, no un resumen.
    @discardableResult
    func sendTrainingFile(_ url: URL) -> Bool {
        guard WCSession.isSupported(), session.activationState == .activated else { return false }
        session.transferFile(url, metadata: [Self.trainingFileKey: true])
        return true
    }

    /// JSON del contrato listo para consumir. Claves ordenadas para que dos envíos de la
    /// misma sesión sean bit a bit idénticos y comparables en logs.
    static func contractJSON(for session: PadelSession) -> String? {
        let payload = session.toPayload(shareHealth: true, includeEvents: false)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        guard let data = try? encoder.encode(payload) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static let payloadKey = "padel_session"
    static let sessionIdKey = "padel_session_id"
    static let trainingFileKey = "padel_training_data"
    static let settingsKey = "padel_settings"
    static let contractKey = "padel_session_contract"
}

extension PhoneTransport: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if activationState == .activated {
            flushPending()
            applyContext(session.receivedApplicationContext)
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
        applyContext(context)
    }
}
