import { type IClientOptions, type IClientPublishOptions } from 'mqtt'
import { type ElementProxy } from 'ymlr/src/components/element-proxy'
import { type Mqtt } from './mqtt'

export interface MqttPubProps {
  mqtt?: ElementProxy<Mqtt>
  uri?: string
  topics?: string[]
  topic?: string
  data?: any
  opts?: IClientOptions
  pubOpts?: IClientPublishOptions
}
