import { IClientOptions, IClientPublishOptions } from 'mqtt'
import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { Mqtt } from './mqtt'

export interface MqttPubProps {
  mqtt?: ElementProxy<Mqtt>
  uri?: string
  topics?: string[]
  topic?: string
  data?: any
  opts?: IClientOptions
  pubOpts?: IClientPublishOptions
}
