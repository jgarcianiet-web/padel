import ExpoModulesCore

/// Activa el receptor en el arranque, no en el primer acceso desde JS: si iOS despierta
/// la app en segundo plano para entregar una sesión del reloj, React Native puede no
/// llegar a cargar nunca, y la sesión tiene que quedar guardada igualmente.
public class WatchSyncAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    WatchSyncReceiver.shared.activate()
    return true
  }
}
