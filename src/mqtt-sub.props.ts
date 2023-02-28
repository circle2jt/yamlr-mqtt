import { IClientOptions, IClientSubscribeOptions } from 'mqtt'
import { JobProps } from 'ymlr/src/components/.job/job.props'
import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { Mqtt } from './mqtt'

export type MqttSubProps = {
  mqtt?: ElementProxy<Mqtt>
  uri?: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics?: string[]
  topic?: string
} & JobProps
