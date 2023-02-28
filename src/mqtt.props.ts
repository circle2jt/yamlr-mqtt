import { IClientOptions } from 'mqtt'
import { GroupItemProps, GroupProps } from 'ymlr/src/components/group/group.props'
import { MqttPubProps } from './mqtt-pub.props'
import { MqttSubProps } from './mqtt-sub.props'

export type MqttProps = {
  uri: string
  opts?: IClientOptions
  runs?: Array<GroupItemProps | {
    'ymlr-mqtt\'pub': MqttPubProps
  } | {
    'ymlr-mqtt\'sub': MqttSubProps
  }>
} & GroupProps
