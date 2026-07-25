import { useLocalSearchParams } from 'expo-router';

import { CompeticionScreen } from '@/src/screens/CompeticionScreen';

export default function Competicion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CompeticionScreen id={id} />;
}
