import assert from 'assert'
import { Job } from 'ymlr/src/components/.job/job'
import { IClientOptions, IClientSubscribeOptions } from 'mqtt'
import { Mqtt } from './mqtt'
import { MqttSubProps } from './mqtt-sub.props'

/** |**  ymlr-mqtt'sub
  Subscribe topics in mqtt
  @example
  ```yaml
    - ymlr-mqtt'sub:
        title: "[mqtt] localhost"
        uri: mqtt://user:pass@mqtt
        topic: topic1
        topics:                               # topics which is subscribed
          - topic1
          - topic2
        runs:                                 # When a message is received then it will runs them
          - ${this.parentState}               # - Received data in a topic
          - ${this.parentState.topicName}     # - Topic name
          - ${this.parentState.topicData}     # - Received message which is cast to object
          - ${this.parentState.topicMsg}      # - Received message which is text

          - ...
          # Other elements
  ```
  Used in global mqtt
  ```yaml
    - ymlr-mqtt:
        title: Global MQTT
        uri: mqtt://user:pass@mqtt
        runs:
          - ymlr-mqtt'sub:
              title: "[mqtt] localhost"
              topic: topic1
              topics:                               # topics which is subscribed
                - topic1
                - topic2
              runs:                                 # When a message is received then it will runs them
                - ${this.parentState}               # - Received data in a topic
                - ${this.parentState.topicName}     # - Topic name
                - ${this.parentState.topicData}     # - Received message which is cast to object
                - ${this.parentState.topicMsg}      # - Received message which is text

                - ...
                # Other elements
  ```
*/
export class MqttSub extends Job {
  uri?: string
  opts?: IClientOptions
  subOpts?: IClientSubscribeOptions
  topics: string[] = []

  mqtt?: Mqtt

  constructor({ uri, opts, subOpts, topics = [], topic, ...props }: MqttSubProps) {
    super(props as any)
    topic && topics.push(topic)
    Object.assign(this, { uri, opts, subOpts, topics })
    this.$$ignoreEvalProps.push('mqtt')
  }

  tryToParseData(msg: string) {
    try {
      return JSON.parse(msg)
    } catch {
      return msg
    }
  }

  async execJob() {
    assert(this.uri, '"uri" is required')
    assert(this.topics.length > 0)

    if (this.uri) {
      this.mqtt = await this.scene.newElement(Mqtt, {
        uri: this.uri,
        opts: this.opts
      }) as Mqtt
    } else {
      this.mqtt = await this.getParentByClassName<Mqtt>(Mqtt)?.newOne()
    }
    assert(this.mqtt)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await this.mqtt.sub(this.topics, async (topic: string, buf: Buffer) => {
      const msg = buf.toString()
      this.logger.debug('⇠ [%s]\t%s', topic, msg)
      await this.addJobData({
        topicName: topic,
        topicMsg: msg,
        topicData: this.tryToParseData(msg)
      })
    }, this.subOpts)
  }

  async stop() {
    if (!this.mqtt) return
    await this.mqtt.stop()
    await super.stop()
    this.mqtt = undefined
  }
}
