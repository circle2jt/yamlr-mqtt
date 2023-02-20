import { join } from 'path'
import { Testing } from 'ymlr/src/testing'
import { Mqtt } from './mqtt'
import { MqttSub } from './mqtt-sub'

beforeEach(async () => {
  await Testing.reset()
  Testing.rootScene.tagsManager.register('ymlr-mqtt', join(__dirname, 'index'))
})

test('Subscribe a topic in mqtt\'sub', async () => {
  const topicName = Math.random().toString()
  const data = {
    say: 'hello world'
  }
  const mqttSub = await Testing.createElementProxy(MqttSub, {
    uri: process.env.MQTT_URI || '',
    topic: topicName,
    runs: [
      {
        vars: {
          topic: '${ $parentState.topicName }',
          data: '${ $parentState.topicData }',
          msg: '${ $parentState.topicMsg }'
        }
      },
      {
        'ymlr-mqtt\'stop': null
      }
    ]
  })
  const mqttPub = await Testing.createElementProxy<Mqtt>(Mqtt, { uri: process.env.MQTT_URI || '' })
  setTimeout(() => mqttPub.element.client.publish(topicName, JSON.stringify(data)), 1000)

  await mqttSub.exec()
  expect(Testing.vars.topic).toBe(topicName)
  expect(Testing.vars.data).toEqual(data)
  expect(Testing.vars.msg).toBe(JSON.stringify(data))

  await mqttSub.dispose()
  await mqttPub.dispose()
})
