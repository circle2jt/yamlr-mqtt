import assert from 'assert'
import { type IClientOptions, type IClientSubscribeOptions } from 'mqtt'
import { type ElementProxy } from 'ymlr/src/components/element-proxy'
import { type Element } from 'ymlr/src/components/element.interface'
import type Group from 'ymlr/src/components/group'
import { type GroupItemProps, type GroupProps } from 'ymlr/src/components/group/group.props'
import { Mqtt } from './mqtt'
import { type MqttSubProps } from './mqtt-sub.props'

/** |**  ymlr-mqtt'sub
  Subscribe topics in mqtt
  @example
  ```yaml
    - name: "[mqtt] localhost"
      ymlr-mqtt'sub:
        uri: mqtt://user:pass@mqtt
        topic: topic1
        topics:                               # topics which is subscribed
          - topic1
          - topic2
        runs:                                 # When a message is received then it will runs them
          - ${ $parentState }                 # - Received data in a topic
          - ${ $parentState.topicName }       # - Topic name
          - ${ $parentState.topicData }       # - Received message which is cast to object
          - ${ $parentState.topicMsg }        # - Received message which is text

          - ...
          # Other elements
  ```

  Used in global mqtt
  ```yaml
    - name: Global MQTT
      ymlr-mqtt:
        uri: mqtt://user:pass@mqtt
        runs:
          - name: "[mqtt] localhost"
            ymlr-mqtt'sub:
              topic: topic1
              topics:                             # topics which is subscribed
                - topic1
                - topic2
              runs:                               # When a message is received then it will runs them
                - ${ $parentState }               # - Received data in a topic
                - ${ $parentState.topicName }     # - Topic name
                - ${ $parentState.topicData }     # - Received message which is cast to object
                - ${ $parentState.topicMsg }      # - Received message which is text

                - ...
                # Other elements
  ```

  Or reuse by global variable
  ```yaml
    - name: Global MQTT
      ymlr-mqtt:
        uri: mqtt://user:pass@mqtt
      vars:
        mqtt1: ${this}

    - name: "[mqtt] localhost"
      ymlr-mqtt'sub:
        mqtt: ${ $vars.mqtt1 }
        topic: topic1
        topics:                             # topics which is subscribed
          - topic1
          - topic2
        runs:                               # When a message is received then it will runs them
          - ${ $parentState }               # - Received data in a topic
          - ${ $parentState.topicName }     # - Topic name
          - ${ $parentState.topicData }     # - Received message which is cast to object
          - ${ $parentState.topicMsg }      # - Received message which is text

          - ...
          # Other elements

          - stop:                           # - Stop subscribing
  ```
*/
export class MqttSub implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>

  uri?: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics: string[] = []

  mqtt?: ElementProxy<Mqtt>

  constructor({ uri, opts, subOpts, topics = [], topic, mqtt }: MqttSubProps) {
    topic && topics.push(topic)
    Object.assign(this, { uri, opts, subOpts, topics, mqtt })
  }

  tryToParseData(msg: string) {
    try {
      return JSON.parse(msg)
    } catch {
      return msg
    }
  }

  async exec(parentState?: any) {
    let mqtt = this.mqtt
    if (!mqtt) {
      if (this.uri) {
        this.mqtt = mqtt = await this.proxy.scene.newElementProxy(Mqtt, {
          uri: this.uri,
          opts: this.opts
        })
        mqtt.logger = this.proxy.logger
        await mqtt.exec()
      } else {
        mqtt = this.proxy.getParentByClassName<Mqtt>(Mqtt)
      }
    }
    assert(mqtt, '"uri" is required OR "ymlr-redis\'pub" only be used in "ymlr-redis"')

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await mqtt.$.sub(this.topics, async (topic: string, buf: Buffer) => {
      const msg = buf.toString()
      await this.innerRunsProxy.exec({
        ...parentState,
        topicName: topic,
        topicMsg: msg,
        topicData: this.tryToParseData(msg)
      })
    }, this.subOpts)
    await mqtt.$.waitToDone()
  }

  async stop() {
    await this.mqtt?.$.unsub(this.topics, undefined, true)
    await this.mqtt?.$.stop()
    this.mqtt = undefined
  }

  async dispose() {
    await this.stop()
  }
}
