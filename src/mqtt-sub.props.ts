import { IClientOptions, IClientSubscribeOptions } from 'mqtt'
import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { Mqtt } from './mqtt'

export interface MqttSubProps {
  mqtt?: ElementProxy<Mqtt>
  uri?: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics?: string[]
  topic?: string
}
