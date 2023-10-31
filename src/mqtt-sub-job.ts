import { type Job } from 'ymlr/src/libs/queue-jobs/job'

export class MqttSubJob implements Job {
  constructor(private readonly exec: (parentState: any) => void | Promise<void>, private readonly jobData: { topicData: { name: string, msg: string, data: any } }) {

  }

  async jobExecute() {
    await this.exec(this.jobData)
  }
}
