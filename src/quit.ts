
import { JobStop } from 'ymlr/src/components/.job/job-stop'
import { MqttSub } from './mqtt-sub'
import { QuitProps } from './quit.props'

/** |**  ymlr-mqtt'quit
  Stop subscribed. Only used in "ymlr-mqtt'sub"
  @example
  ```yaml
    - ymlr-mqtt'sub:
        uri: redis://redis:6379
        topics:                     # Topics which is subscribed
          - topic1
        runs:                       # When a message is received then it will runs them
          - ymlr-mqtt'stop:        # Stop subscribed
  ```
*/
export class Quit extends JobStop {
  protected type = MqttSub

  constructor(props?: QuitProps) {
    super(props)
  }

  async exec() {
    const sub = this.proxy.getParentByClassName<MqttSub>(MqttSub)?.element
    await sub?.stop()
  }
}
