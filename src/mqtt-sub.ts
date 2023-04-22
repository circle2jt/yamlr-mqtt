import assert from 'assert'
import { IClientOptions, IClientSubscribeOptions } from 'mqtt'
import { Job } from 'ymlr/src/components/.job/job'
import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { Mqtt } from './mqtt'
import { MqttSubProps } from './mqtt-sub.props'

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
  ```
*/
export class MqttSub extends Job {
  uri?: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics: string[] = []

  mqtt?: ElementProxy<Mqtt>

  constructor({ uri, opts, subOpts, topics = [], topic, mqtt, ...props }: MqttSubProps) {
    super(props as any)
    topic && topics.push(topic)
    Object.assign(this, { uri, opts, subOpts, topics, mqtt })
    // this.ignoreEvalProps.push('mqtt')
  }

  tryToParseData(msg: string) {
    try {
      return JSON.parse(msg)
    } catch {
      return msg
    }
  }

  async execJob() {
    if (!this.mqtt) {
      if (this.uri) {
        this.mqtt = await this.scene.newElementProxy(Mqtt, {
          uri: this.uri,
          opts: this.opts
        })
      } else {
        this.mqtt = await this.proxy.getParentByClassName<Mqtt>(Mqtt)
      }
    }
    assert(this.mqtt)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await this.mqtt.$.sub(this.topics, async (topic: string, buf: Buffer) => {
      const msg = buf.toString()
      await this.addJobData({
        topicName: topic,
        topicMsg: msg,
        topicData: this.tryToParseData(msg)
      })
    }, this.subOpts)
    await this.mqtt.$.waitToDone()
  }

  async stop() {
    await this.mqtt?.$.stop()
    await super.stop()
    this.mqtt = undefined
  }
}
