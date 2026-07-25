import { useLocalSearchParams } from 'expo-router';

import { PartidoScreen } from '@/src/screens/PartidoScreen';

export default function Partido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PartidoScreen id={id} />;
}
