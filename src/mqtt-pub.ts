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

  Or reuse by global variable
  Reuse mqtt connection to publish multiple times
  ```yaml
    - name: "[mqtt] localhost"
      ymlr-mqtt:
        uri: mqtt://user:pass@mqtt
      vars:
        mqtt1: ${this}

    - ymlr-mqtt'pub:
        mqtt: ${ $vars.mqtt1 }
        topics:
          - topic1
        pubOpts:
          qos?: 0 | 1 | 2
        data:
          name: thanh
  ```
*/
export class MqttPub implements Element {
  // ignoreEvalProps = ['mqtt']
  proxy!: ElementProxy<this>

  uri?: string
  opts?: IClientOptions
  pubOpts?: IClientPublishOptions
  data?: any
  topics: string[] = []

  mqtt?: ElementProxy<Mqtt>

  constructor({ topics = [], topic, mqtt, ...props }: MqttPubProps) {
    topic && topics.push(topic)
    Object.assign(this, { topics, mqtt, ...props })
  }

  async exec(parentState: any) {
    assert(this.topics.length > 0)
    let mqtt = this.mqtt
    if (!mqtt) {
      if (this.uri) {
        mqtt = this.mqtt = await this.proxy.scene.newElementProxy(Mqtt, {
          uri: this.uri,
          opts: this.opts
        })
        mqtt.logger = this.proxy.logger
        await this.mqtt.exec(parentState)
      } else {
        mqtt = await this.proxy.getParentByClassName<Mqtt>(Mqtt)
      }
    }
    assert(mqtt, '"uri" is required OR "ymlr-mqtt\'pub" only be used in "ymlr-mqtt"')
    await mqtt.$.pub(this.topics, this.data, this.pubOpts)
    return this.data
  }

  async stop() {
    if (this.uri) {
      await this.mqtt?.$.stop()
      this.mqtt = undefined
    }
  }

  async dispose() {
    await this.stop()
  }
}
