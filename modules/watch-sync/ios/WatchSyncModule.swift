import ExpoModulesCore
import WatchConnectivity

public class WatchSyncModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchSync")

    Events("onSesionReloj")

    OnStartObserving {
      WatchSyncReceiver.shared.onSesionRecibida = { [weak self] sessionId, datos in
        self?.sendEvent("onSesionReloj", ["id": sessionId, "datos": datos])
      }
    }

    OnStopObserving {
      WatchSyncReceiver.shared.onSesionRecibida = nil
    }

    /// true si este dispositivo puede emparejarse con un Apple Watch.
    Function("soportado") {
      WCSession.isSupported()
    }

    /// Cola de sesiones recibidas del reloj y aún no importadas, en orden de llegada.
    Function("getPendientes") { () -> [[String: String]] in
      WatchSyncReceiver.shared.pendientes
    }

    /// Saca la sesión de la cola (importada o descartada por el usuario).
    Function("consumir") { (sessionId: String) in
      WatchSyncReceiver.shared.consumir(sessionId)
    }
  }
}
