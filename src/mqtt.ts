import assert from 'assert'
import { Group } from 'ymlr/src/components/group/group'
import { GroupItemProps } from 'ymlr/src/components/group/group.props'
import { connect, IClientOptions, IClientPublishOptions, IClientSubscribeOptions, IPublishPacket, MqttClient, OnMessageCallback } from 'mqtt'
import { MqttProps } from './mqtt.props'

/** |**  ymlr-mqtt
  Declare a mqtt connector
  @example
  ```yaml
    - ymlr-mqtt:
        title: "[mqtt] localhost"
        uri: mqtt://user:pass@mqtt            # Mqtt uri
        runs:                                 # When a message is received then it will runs them
          - echo: Mqtt is connected
  ```
  Publish a message to topics
  ```yaml
    - ymlr-mqtt:
        title: "[mqtt] localhost"
        uri: mqtt://user:pass@mqtt            # Mqtt uri
        runs:                                 # When a message is received then it will runs them
          - ymlr-mqtt'pub:
              title: Publish a message
              topics:
                - test
              data:
                msg: Hello world
  ```
*/
export class Mqtt extends Group<MqttProps, GroupItemProps> {
  private _client?: MqttClient
  get client() {
    return this._client || (this._client = connect(this.uri || '', this.opts))
  }

  uri?: string
  opts?: IClientOptions
  callbacks?: OnMessageCallback[]
  private resolve?: Function

  constructor(private readonly _props: MqttProps) {
    const { uri, opts, ...props } = _props
    super(props as any)
    Object.assign(this, { uri, opts, _props })
    this.$$ignoreEvalProps.push('client', 'callbacks', '_client', '_props')
  }

  async newOne() {
    const newOne = await (this.parent as Group<any, any>).newElement(Mqtt, this._props) as Mqtt
    return newOne
  }

  async pub(topics: string[], data: any, opts?: IClientPublishOptions) {
    let msg = data ?? ''
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg)
    }
    const proms = topics?.map(async topic => {
      await new Promise((resolve, reject) => this.client.publish(topic, msg.toString(), opts || {}, (err: any) => err ? reject(err) : resolve(undefined)))
    })
    if (proms?.length) {
      await Promise.all(proms)
    }
  }

  async sub(topics: string[], cb: OnMessageCallback | undefined, opts?: IClientSubscribeOptions) {
    if (!topics?.length) return
    this.logger.debug(`Subscribed "${topics}" in "${this.uri}"`)
    await new Promise((resolve, reject) => {
      if (!opts) {
        this.client.subscribe(topics, (err) => !err ? resolve(undefined) : reject(err))
      } else {
        this.client.subscribe(topics, opts, (err) => !err ? resolve(undefined) : reject(err))
      }
    })
    if (cb) {
      if (!this.callbacks) {
        this.callbacks = []
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.client.on('message', this.onMessage.bind(this))
      }
      this.callbacks.push(cb)
    }

    await new Promise(resolve => {
      this.resolve = resolve
    })
  }

  async onMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
    const proms = this.callbacks?.map(cb => cb(topic, payload, packet))
    if (proms?.length) {
      await Promise.all(proms)
    }
  }

  async unsub(topics?: string[], opts?: IClientSubscribeOptions) {
    if (!topics?.length) return
    await new Promise((resolve, reject) => {
      this.logger.debug(`Subscribed "${topics}" in "${this.uri}"`)
      this.client.unsubscribe(topics, opts || {}, (err) => !err ? resolve(undefined) : reject(err))
    })
  }

  async exec() {
    assert(this.uri, '"uri" is required')
    await new Promise((resolve, reject) => {
      this.client.on('connect', resolve).on('error', reject)
    })
    const rs = await super.exec()
    return rs
  }

  async stop() {
    if (!this._client) return
    await new Promise((resolve, reject) => this.client.end(false, {}, (err) => !err ? resolve(undefined) : reject(err)))
    if (this.resolve) this.resolve(undefined)
    this._client = undefined
  }

  async dispose() {
    await this.stop()
  }
}
