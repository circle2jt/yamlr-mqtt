import { IClientOptions, IClientSubscribeOptions } from 'mqtt'
import { JobProps } from 'ymlr/src/components/.job/job.props'

export type MqttSubProps = {
  uri: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics?: string[]
  topic?: string
} & JobProps
