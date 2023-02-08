import { ElementProps } from 'ymlr/src/components/element.props'
import { IClientOptions } from 'mqtt'

export type MqttPubProps = {
  uri: string
  topics?: string[]
  topic?: string
  data?: any
  opts?: IClientOptions
} & ElementProps
