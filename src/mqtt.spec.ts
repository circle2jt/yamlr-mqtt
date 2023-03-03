import { ElementProxy } from 'ymlr/src/components/element-proxy'
import { sleep } from 'ymlr/src/libs/time'
import { Testing } from 'ymlr/src/testing'
import { Mqtt } from './mqtt'

let mqtt: ElementProxy<Mqtt>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await mqtt.dispose()
})

test('test mqtt', async () => {
  const topicName = Math.random().toString()
  mqtt = await Testing.createElementProxy(Mqtt, {
    uri: process.env.MQTT_URI,
    topics: [topicName],
    runs: [{
      echo: 'hello'
    }]
  })
  const [echo] = await mqtt.exec()
  expect(mqtt.$.client).toBeDefined()
  expect(echo.result).toBe('hello')
})

test('subscribe', async () => {
  const topicName = Math.random().toString()
  mqtt = await Testing.createElementProxy(Mqtt, {
    uri: process.env.MQTT_URI,
    topics: [topicName],
    runs: [{
      echo: 'hello'
    }]
  })
  await mqtt.exec()
  const topicCount = [0, 0]
  await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      await mqtt.$.pub(['topic-0'], undefined)
      await mqtt.$.pub(['topic-1'], undefined)
      await mqtt.$.pub(['topic-1'], undefined)
      await sleep(500)
      await mqtt.$.stop()
    }, 500),
    mqtt.$.sub(['topic-0'], () => {
      topicCount[0]++
    }),
    mqtt.$.sub(['topic-1'], () => {
      topicCount[1]++
    })
  ])
  expect(topicCount[0]).toBe(1)
  expect(topicCount[1]).toBe(2)
})
