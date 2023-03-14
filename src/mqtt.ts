import assert from 'assert'
import { connect, IClientOptions, IClientPublishOptions, IClientSubscribeOptions, IPublishPacket, MqttClient, OnMessageCallback } from 'mqtt'
import { Group } from 'ymlr/src/components/group/group'
import { GroupItemProps } from 'ymlr/src/components/group/group.props'
import { MqttProps } from './mqtt.props'

/** |**  ymlr-mqtt
  Declare a mqtt connector
  @example
  ```yaml
    - name: "[mqtt] localhost"
      ymlr-mqtt:
        uri: mqtt://user:pass@mqtt            # Mqtt uri
        runs:                                 # When a message is received then it will runs them
          - echo: Mqtt is connected
  ```
  Publish a message to topics
  ```yaml
    - name: "[mqtt] localhost"
      ymlr-mqtt:
        uri: mqtt://user:pass@mqtt            # Mqtt uri
        runs:                                 # When a message is received then it will runs them
          - name: Publish a message
            ymlr-mqtt'pub:
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
  callbacks?: Record<string, OnMessageCallback[]>
  private resolve?: Function
  private promSubscribe?: Promise<any>

  constructor(private readonly _props: MqttProps) {
    const { uri, opts, ...props } = _props
    super(props as any)
    Object.assign(this, { uri, opts, _props })
    this.ignoreEvalProps.push('callbacks', '_client', '_props', 'resolve')
  }

  async newOne() {
    const newOne = await (this.proxy.parent as Group<any, any>).newElementProxy(Mqtt, this._props)
    return newOne
  }

  async pub(topics: string[], data: any, opts?: IClientPublishOptions) {
    if (!topics?.length) return
    let msg = data ?? ''
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg)
    }
    this.logger.debug('⇢ [%s]\t%j', topics.join('|'), msg.toString())
    const proms = topics.map(async topic => {
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
        this.callbacks = {}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.client.on('message', this.onMessage.bind(this))
      }
      for (const topic of topics) {
        if (!this.callbacks[topic]) this.callbacks[topic] = []
        this.callbacks[topic].push(cb)
      }
    }

    if (!this.promSubscribe) {
      this.promSubscribe = new Promise(resolve => {
        this.resolve = resolve
      })
    }
    await this.promSubscribe
  }

  async onMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
    if (!this.callbacks) return
    const callbacks = this.callbacks[topic]
    if (!callbacks?.length) return
    this.logger.debug('[%s]\t%s', topic, payload.toString())
    await Promise.all(callbacks.map(cb => cb(topic, payload, packet)))
  }

  async unsub(topics?: string[], opts?: IClientSubscribeOptions) {
    if (!topics?.length) return
    await new Promise((resolve, reject) => {
      this.logger.debug(`Subscribed "${topics}" in "${this.uri}"`)
      this.client.unsubscribe(topics, opts || {}, (err) => !err ? resolve(undefined) : reject(err))
      topics?.forEach(topic => delete this.callbacks?.[topic])
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
