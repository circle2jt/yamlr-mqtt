import { JobProps } from 'ymlr/src/components/.job/job.props'
import { IClientOptions } from 'mqtt'

export type MqttSubProps = {
  uri: string
  opts?: IClientOptions
  topics?: string[]
  topic?: string
} & JobProps
