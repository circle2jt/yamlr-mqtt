import { join } from 'path'
import { sleep } from 'ymlr/src/libs/time'
import { Testing } from 'ymlr/src/testing'
import { Mqtt } from './mqtt'
import { MqttPub } from './mqtt-pub'

beforeEach(async () => {
  await Testing.reset()
  Testing.rootScene.tagsManager.register('ymlr-mqtt', join(__dirname, 'index'))
})

test('publish a message in ymlr-mqtt\'pub', async () => {
  const topicName = Math.random().toString()
  const mqtt = await Testing.createElementProxy<Mqtt>(Mqtt, {
    uri: process.env.MQTT_URI || ''
  })
  // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
  const t = new Promise(async (resolve) => {
    await mqtt.element.sub([topicName], (topic: string, buf: Buffer) => {
      Testing.vars.topic = topic
      Testing.vars.data = buf.toString()
      resolve(undefined)
    })
  })
  await sleep(1000)
  const pub = await Testing.createElementProxy(MqttPub, {
    uri: process.env.MQTT_URI || '',
    topic: topicName,
    data: 'hello world'
  })
  await pub.exec()
  await pub.dispose()
  await t
  await mqtt.dispose()
  expect(Testing.vars.topic).toBe(topicName)
  expect(Testing.vars.data).toBe('hello world')
})

test('publish a message in ymlr-mqtt\'pub - used in ymlr-mqtt', async () => {
  const topicName = Math.random().toString()
  const data = {
    say: 'hello world'
  }
  const mqtt = await Testing.createElementProxy<Mqtt>(Mqtt, {
    uri: process.env.MQTT_URI || '',
    runs: [
      {
        'ymlr-mqtt\'pub': {
          topics: [topicName],
          data
        }
      }
    ]
  })
  const sub = await Testing.createElementProxy<Mqtt>(Mqtt, {
    uri: process.env.MQTT_URI || ''
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises, no-async-promise-executor
  const t = new Promise(async (resolve) => {
    await sub.element.sub([topicName], (topic: string, buf: Buffer) => {
      Testing.vars.topic = topic
      Testing.vars.data = buf.toString()
      resolve(undefined)
    })
  })
  await sleep(1000)
  await mqtt.exec()
  await t
  await sub.dispose()
  expect(Testing.vars.topic).toBe(topicName)
  expect(Testing.vars.data).toBe(JSON.stringify(data))
  await mqtt.dispose()
})
