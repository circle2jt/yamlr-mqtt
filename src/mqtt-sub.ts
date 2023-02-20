import assert from 'assert'
import { IClientOptions, IClientSubscribeOptions } from 'mqtt'
import { Job } from 'ymlr/src/components/.job/job'
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
    this.ignoreEvalProps.push('mqtt')
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
      const mqttProxy = await this.scene.newElementProxy(Mqtt, {
        uri: this.uri,
        opts: this.opts
      })
      this.mqtt = mqttProxy?.element as Mqtt
    } else {
      const mqttProxy = await this.proxy.getParentByClassName<Mqtt>(Mqtt)?.element?.newOne()
      this.mqtt = mqttProxy?.element as Mqtt
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
