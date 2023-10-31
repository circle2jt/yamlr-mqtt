import { type IClientOptions, type IClientSubscribeOptions } from 'mqtt'
import { type ElementProxy } from 'ymlr/src/components/element-proxy'
import { type Mqtt } from './mqtt'

export interface MqttSubProps {
  mqtt?: ElementProxy<Mqtt>
  uri?: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics?: string[]
  topic?: string
}
