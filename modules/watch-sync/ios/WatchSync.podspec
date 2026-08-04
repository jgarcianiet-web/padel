Pod::Spec.new do |s|
  s.name           = 'WatchSync'
  s.version        = '1.0.0'
  s.summary        = 'Receptor WatchConnectivity de Rising Padel Watch'
  s.description    = 'Recibe las sesiones que envía la app del reloj embebida y las guarda hasta que la liga las importa.'
  s.author         = ''
  s.homepage       = 'https://github.com/jgarcianiet-web/padel'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
