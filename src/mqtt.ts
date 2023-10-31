import assert from 'assert'
import { IClientOptions, IClientPublishOptions, IClientSubscribeOptions, IPublishPacket, MqttClient, OnMessageCallback, connect } from 'mqtt'
import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { Element } from 'ymlr/src/components/element.interface'
import { Group } from 'ymlr/src/components/group/group'
import { GroupItemProps, GroupProps } from 'ymlr/src/components/group/group.props'
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
export class Mqtt implements Element {
  readonly proxy!: ElementProxy<this>
  readonly innerRunsProxy!: ElementProxy<Group<GroupProps, GroupItemProps>>
  readonly ignoreEvalProps = ['callbacks', 'resolve', 'promSubscribe']

  client!: MqttClient

  uri?: string
  opts?: IClientOptions

  private callbacks?: {
    id: Map<string, OnMessageCallback>
    text?: Map<string, Set<OnMessageCallback>>
  }

  private resolve?: Function
  private promSubscribe?: Promise<any>

  get logger() {
    return this.proxy.logger
  }

  constructor(private readonly props: MqttProps) {
    Object.assign(this, props)
  }

  async newOne() {
    const newOne = await (this.proxy.parent as Group<any, any>).newElementProxy<Mqtt>(Mqtt, this.props)
    await newOne.exec()
    return newOne
  }

  async waitToDone() {
    if (!this.promSubscribe) return
    return await this.promSubscribe
  }

  async pub(topics: string[] | string, data?: any, opts?: IClientPublishOptions) {
    if (!Array.isArray(topics)) topics = [topics]
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

  async sub(topics: string[] | string, cb: OnMessageCallback | undefined, opts?: IClientSubscribeOptions) {
    let callbackType = 1
    const callbackIDs = [] as string[]
    if (!Array.isArray(topics)) {
      topics = [topics]
      callbackType = 0
    }
    if (topics?.length) {
      this.logger.debug(`Subscribed "${topics}" in "${this.uri}"`)
      if (topics.length) {
        await new Promise((resolve, reject) => {
          if (!opts) {
            this.client.subscribe(topics, (err) => !err ? resolve(undefined) : reject(err))
          } else {
            this.client.subscribe(topics, opts, (err) => !err ? resolve(undefined) : reject(err))
          }
        })
      }
      if (cb) {
        if (!this.callbacks) {
          this.callbacks = {
            id: new Map(),
            text: undefined
          }
        }
        if (!this.callbacks?.text) {
          this.callbacks.text = new Map()
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          this.client.on('message', this.onMessage.bind(this))
        }
        const cbChannels = this.callbacks.text as Map<string, Set<any>>
        const id: Map<string, any> = this.callbacks.id
        const rd = Math.random().toString()
        topics.forEach((topic, i) => {
          if (!cbChannels.has(topic)) cbChannels.set(topic, new Set())

          const callbackID = `${topic}:${i}:${rd}`
          id.set(callbackID, cb)
          cbChannels.get(topic)?.add(id.get(callbackID))
          callbackIDs.push(callbackID)
        })

        if (!this.promSubscribe) {
          this.promSubscribe = new Promise(resolve => {
            this.resolve = resolve
          })
        }
      }
    }
    return callbackType === 1 ? callbackIDs : callbackIDs[0]
  }

  async onMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
    if (!this.callbacks) return
    const callbacks = this.callbacks.text?.get(topic) as Set<OnMessageCallback>
    if (!callbacks?.size) return
    this.logger.debug('⇠ [%s]\t%s', topic, payload)
    await Promise.all([...callbacks].map(cb => cb(topic, payload, packet)))
  }

  async unsub(topics: string[], opts?: IClientSubscribeOptions, isRemoveCallback = true) {
    if (typeof topics === 'string') {
      topics = [topics]
    }
    if (!topics.length) return
    this.logger.debug(`Subscribed "${topics}" in "${this.uri}"`)
    await new Promise((resolve, reject) => {
      this.client.unsubscribe(topics, opts, (err) => !err ? resolve(undefined) : reject(err))
    })
    if (isRemoveCallback) {
      topics.forEach(topic => {
        Object.keys(this.callbacks?.id || {})
          .filter(uuid => uuid.includes(`:${topic}:`))
          .forEach(uuid => this.callbacks?.id.delete(uuid))
        this.callbacks?.text?.delete(topic)
      })
    }
  }

  async removeCb(uuids: string | string[]) {
    if (!Array.isArray(uuids)) {
      uuids = [uuids]
    }
    [...(this.callbacks?.id.keys() || [])]
      .filter((uuid: string) => uuids.includes(uuid))
      .forEach((uuid: string) => {
        const [channel] = uuid.split(':')
        const cb = this.callbacks?.id.get(uuid)
        if (cb) {
          const ch = this.callbacks?.text?.get(channel)
          ch?.delete(cb)
        }
        this.callbacks?.id.delete(uuid)
      })
  }

  async exec(parentState?: any) {
    assert(this.uri, '"uri" is required')
    this.client = connect(this.uri || '', this.opts)
    await new Promise((resolve, reject) => {
      this.client.on('connect', resolve).on('error', reject)
    })
    const rs = await this.innerRunsProxy.exec(parentState)
    return rs
  }

  async stop() {
    await new Promise((resolve, reject) => this.client.end(false, {}, (err) => !err ? resolve(undefined) : reject(err)))
    if (this.resolve) this.resolve(undefined)
  }

  async dispose() {
    await this.stop()
  }
}
