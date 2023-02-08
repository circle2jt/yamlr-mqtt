import { Job } from 'ymlr/src/libs/queue-jobs/job'

export class MqttSubJob implements Job {
  constructor(private readonly exec: Function, private readonly jobData: { topicData: { name: string, msg: string, data: any } }) {

  }

  async jobExecute() {
    await this.exec(this.jobData)
  }
}
