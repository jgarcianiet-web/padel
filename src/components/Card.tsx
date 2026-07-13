import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { S } from '../theme/styles';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, style }: Props) {
  return <View style={[S.card, style]}>{children}</View>;
}
