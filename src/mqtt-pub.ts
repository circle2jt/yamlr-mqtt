import assert from 'assert'
import { ElementShadow } from 'ymlr/src/components/element-shadow'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import { Mqtt } from './mqtt'
import { MqttPubProps } from './mqtt-pub.props'

/** |**  ymlr-mqtt'pub
  Publish a message to topics in mqtt
  @example
  Publish a message to mqtt
  ```yaml
    - ymlr-mqtt'pub:
        title: "[mqtt] localhost"
        uri: mqtt://user:pass@mqtt
        topic: topic1
        topics:
          - topic2
          - topic3
        pubOpts:
          qos?: 0 | 1 | 2
        data:
          name: thanh
  ```

  Reuse mqtt connection to publish multiple times
  ```yaml
    - ymlr-mqtt:
        title: "[mqtt] localhost"
        uri: mqtt://user:pass@mqtt
        runs:
          - ymlr-mqtt'pub:
              topics:
                - topic1
              pubOpts:
                qos?: 0 | 1 | 2
              data:
                name: thanh
          - ...
          # Other elements
  ```
*/
export class MqttPub extends ElementShadow {
  uri?: string
  opts?: IClientOptions
  pubOpts?: IClientPublishOptions
  data?: any
  topics: string[] = []

  private mqtt?: Mqtt

  constructor({ topics = [], topic, ...props }: MqttPubProps) {
    super()
    this.$$ignoreEvalProps.push('mqtt')
    topic && topics.push(topic)
    Object.assign(this, { topics, ...props })
  }

  async exec() {
    assert(this.topics.length > 0)
    let mqtt: Mqtt
    if (this.uri) {
      mqtt = this.mqtt = await this.scene.newElement(Mqtt, {
        uri: this.uri,
        opts: this.opts
      }) as Mqtt
    } else {
      mqtt = await this.getParentByClassName<Mqtt>(Mqtt)
    }
    assert(mqtt, '"uri" is required OR "ymlr-mqtt\'pub" only be used in "ymlr-mqtt"')
    await mqtt.pub(this.topics, this.data, this.pubOpts)
    return this.data
  }

  async stop() {
    if (!this.mqtt) return
    await this.mqtt.stop()
    this.mqtt = undefined
  }

  async dispose() {
    await this.stop()
  }
}
