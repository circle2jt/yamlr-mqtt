import { IClientOptions, IClientPublishOptions } from 'mqtt'

export interface MqttPubProps {
  uri: string
  topics?: string[]
  topic?: string
  data?: any
  opts?: IClientOptions
  pubOpts?: IClientPublishOptions
}
