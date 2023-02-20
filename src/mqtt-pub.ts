import assert from 'assert'
import { IClientOptions, IClientPublishOptions } from 'mqtt'
import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { Element } from 'ymlr/src/components/element.interface'
import { Mqtt } from './mqtt'
import { MqttPubProps } from './mqtt-pub.props'

/** |**  ymlr-mqtt'pub
  Publish a message to topics in mqtt
  @example
  Publish a message to mqtt
  ```yaml
    - name: "[mqtt] localhost"
      ymlr-mqtt'pub:
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
    - name: "[mqtt] localhost"
      ymlr-mqtt:
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
export class MqttPub implements Element {
  ignoreEvalProps = ['mqtt']
  proxy!: ElementProxy<this>

  uri?: string
  opts?: IClientOptions
  pubOpts?: IClientPublishOptions
  data?: any
  topics: string[] = []

  private mqtt?: Mqtt

  constructor({ topics = [], topic, ...props }: MqttPubProps) {
    topic && topics.push(topic)
    Object.assign(this, { topics, ...props })
  }

  async exec() {
    assert(this.topics.length > 0)
    let mqtt: Mqtt | undefined
    if (this.uri) {
      const mqttProxy = await this.proxy.scene.newElementProxy(Mqtt, {
        uri: this.uri,
        opts: this.opts
      })
      mqtt = this.mqtt = mqttProxy?.element as Mqtt
    } else {
      const mqttProxy = await this.proxy.getParentByClassName<Mqtt>(Mqtt)
      mqtt = this.mqtt = mqttProxy?.element as Mqtt
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
