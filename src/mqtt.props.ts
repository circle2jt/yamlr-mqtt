import { type IClientOptions } from 'mqtt'

export interface MqttProps {
  uri: string
  opts?: IClientOptions
}
