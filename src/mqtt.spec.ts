import { ElementProxy } from 'ymlr/src/components/element-proxy'
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
    uri: process.env.MQTT_URI || '',
    topics: [topicName],
    runs: [{
      echo: 'hello'
    }]
  })
  const [echo] = await mqtt.exec()
  expect(mqtt.element.client).toBeDefined()
  expect(echo.result).toBe('hello')
})

// test('test mqtt sub', async () => {
//   const topicName = Math.random().toString()
//   mqtt = await Testing.createElementProxy(Mqtt, {
//     uri: process.env.MQTT_URI || '',
//     topics: topicName
//   })
//   const [echo] = await mqtt.exec()
//   expect(mqtt.client).toBeDefined()
//   expect(echo.result).toBe('hello')
// })
