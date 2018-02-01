import test from 'ava'
import React from 'react'
import TestRenderer, { create as render } from 'react-test-renderer'
import util from 'util'
import sinon from 'sinon'
import macro, { Clone } from './src'

const Box = props => <div {...props} />
const Text = props => <div {...props} />
const Heading = props => <h2 {...props} />
const NoName = props => <pre {...props} />

Box.displayName = 'Box'
Text.displayName = 'Text'
Heading.displayName = 'Heading'

test('returns a component', t => {
  const Card = macro({
    h1: 'h1',
    div: 'div',
  }, ({ h1, div }) => (
    <div>
      {h1}
      {div}
    </div>
  ))
  t.is(typeof Card, 'function')
  t.true(React.isValidElement(<Card />))
})

test('renders', t => {
  const Card = macro({
    h1: 'h1',
    div: 'div'
  }, ({ h1, div }) => (
    <div>
      {h1}
      {div}
    </div>
  ))
  const json = render(
    <Card>
      <h1>Hello</h1>
    </Card>
  ).toJSON()
  t.snapshot(json)
})

test('returns a component with React components', t => {
  const Card = macro({
    Heading,
    Text
  }, ({ Heading, Text }) => (
    <div>
      {Heading}
      {Text}
    </div>
  ))
  t.is(typeof Card, 'function')
  const el = (
    <Card>
      <Heading>Hello</Heading>
      <Text>Beep</Text>
    </Card>
  )
  t.true(React.isValidElement(el))
  const json = render(el).toJSON()
  t.snapshot(json)
  const [ a, b ] = json.children
  t.is(a.type, 'h2')
  t.is(a.children[0], 'Hello')
  t.is(b.type, 'div')
  t.is(b.children[0], 'Beep')
})

test('swaps out nested child elements', t => {
  const Nested = macro({
    Heading,
    Text,
  }, ({ Heading, Text }) => (
    <Box>
      <Box>
        {Heading}
      </Box>
      {Text}
    </Box>
  ))
  const json = render(
    <Nested>
      <Heading>Hello</Heading>
      <Text>Text</Text>
    </Nested>
  ).toJSON()
  t.is(json.children[0].children[0].type, 'h2')
  t.is(json.children[0].children[0].children[0], 'Hello')
  t.is(json.children[1].type, 'div')
  t.is(json.children[1].children[0], 'Text')
})

test('handles string children', t => {
  const Card = macro({ Heading }, ({ Heading }) => (
    <div>
      {Heading}
      Hello text
    </div>
  ))
  const json = render(
    <Card>
      <Heading>Hi</Heading>
    </Card>
  ).toJSON()
  t.is(json.children[1], 'Hello text')
})

test.skip('accepts a name prop to map to arguments', t => {
  const Card = macro(({ heading, subhead }) => (
    <div>
      {heading}
      {subhead}
    </div>
  ))
  const json = render(
    <Card>
      <Heading name='heading'>Hello</Heading>
      <Heading name='subhead'>Beep</Heading>
    </Card>
  ).toJSON()
  t.is(json.children[0].type, 'h2')
  t.is(json.children[0].children[0], 'Hello')
  t.is(json.children[1].type, 'h2')
  t.is(json.children[1].children[0], 'Beep')
})

test('updates template on children update', t => {
  const Card = macro({
    Heading,
    Subhead: Heading
  }, ({ Heading, Subhead }) => (
    <div>
      {Heading}
      {Subhead}
    </div>
  ))
  const card = TestRenderer.create(
    <Card>
      <Card.Heading name='heading'>Nope</Card.Heading>
      <Card.Subhead name='subhead'>Nope</Card.Subhead>
    </Card>
  )
  card.update(
    <Card>
      <Card.Heading name='heading'>Hello</Card.Heading>
      <Card.Subhead name='subhead'>Beep</Card.Subhead>
    </Card>
  )
  const json = card.toJSON()
  t.is(json.children[0].type, 'h2')
  t.is(json.children[0].children[0], 'Hello')
  t.is(json.children[1].type, 'h2')
  t.is(json.children[1].children[0], 'Beep')
})

test('skips template update', t => {
  const Card = macro({
    Heading
  }, ({ Heading }) => (
    <div>
      {Heading}
    </div>
  ))
  const children = (
    <Heading>Hello</Heading>
  )
  const card = TestRenderer.create(
    <Card>
      {children}
    </Card>
  )
  card.update(
    <Card>
      {children}
    </Card>
  )
  const json = card.toJSON()
  t.is(json.children[0].type, 'h2')
  t.is(json.children[0].children[0], 'Hello')
})

test('Clone returns a cloned element', t => {
  const el = <Heading>Hello</Heading>
  const json = render(
    <Clone
      element={el}
      fontSize={4}
      color='tomato'
    />
  ).toJSON()
  t.is(json.type, 'h2')
  t.is(json.props.fontSize, 4)
  t.is(json.props.color, 'tomato')
})

test('Clone returns false with no element', t => {
  const json = render(
    <Clone
      fontSize={4}
      color='tomato'
    />
  ).toJSON()
  t.is(json, null)
})

test.skip('accepts an optional childTypes argument', t => {
  const stub = sinon.stub(console, 'error')
  const Card = macro(({ Heading }) => (
    <div>
      {Heading}
    </div>
  ), {
    childTypes: [ Heading ]
  })
  const json = render(
    <Card>
      <Heading>Hello</Heading>
      <h2>Nope</h2>
    </Card>
  ).toJSON()
  t.is(json.children[0].type, 'h2')
  t.is(json.children[1], undefined)
  t.true(stub.calledOnce)
  stub.restore()
})

test.skip('element function can use component type as keys', t => {
  const Card = macro(elements => (
    <div>
      {elements[Box]}
      {elements[NoName]}
    </div>
  ))
  const json = render(
    <Card>
      <Box>Hello</Box>
      <NoName>Hi</NoName>
    </Card>
  ).toJSON()
  t.is(json.children[0].children[0], 'Hello')
  t.is(json.children[1].type, 'pre')
  t.is(json.children[1].children[0], 'Hi')
})
