import { describe, test, expect } from 'vitest'
import React from 'react'
import TestRenderer from 'react-test-renderer'

import macro, { Clone } from '../src'

const Box = props => <div {...props} />
const Text = props => <div {...props} />
const Heading = props => <h2 {...props} />
const NoName = props => <pre {...props} />

Box.displayName = 'Box'
Text.displayName = 'Text'
Heading.displayName = 'Heading'

test('returns a component', () => {
  const Card = macro({
    h1: 'h1',
    div: 'div',
  })(({ h1, div }) => (
    <div>
      {h1}
      {div}
    </div>
  ))
  expect(typeof Card).toBe('function')
  expect(React.isValidElement(<Card />)).toBe(true)
})

test('renders', () => {
  const Card = macro({
    h1: 'h1',
    div: 'div'
  })(({ h1, div }) => (
    <div>
      {h1}
      {div}
    </div>
  ))
  const json = TestRenderer.create(
    <Card>
      <Card.h1>Hello</Card.h1>
    </Card>
  ).toJSON()
  expect(json).toMatchSnapshot()
})

test('returns a component with React components', () => {
  const Card = macro({
    Heading,
    Text
  })(({ Heading, Text }) => (
    <div>
      {Heading}
      {Text}
    </div>
  ))
  expect(typeof Card).toBe('function')
  const el = (
    <Card>
      <Card.Heading>Hello</Card.Heading>
      <Card.Text>Beep</Card.Text>
    </Card>
  )
  expect(React.isValidElement(el)).toBe(true)
  const render = TestRenderer.create(el)
  const json = render.toJSON()
  expect(json).toMatchSnapshot()

  const [ a, b ] = json.children
  expect(a.type).toBe('h2')
  expect(a.children[0]).toBe('Hello')
  expect(b.type).toBe('div')
  expect(b.children[0]).toBe('Beep')
})

test('swaps out nested child elements', () => {
  const Nested = macro({
    Heading,
    Text,
  })(({ Heading, Text }) => (
    <Box>
      <Box>
        {Heading}
      </Box>
      {Text}
    </Box>
  ))

  const json = TestRenderer.create(
    <Nested>
      <Nested.Heading>Hello</Nested.Heading>
      <Nested.Text>Text</Nested.Text>
    </Nested>
  ).toJSON();
  
  expect(json.type).toBe('div')
  expect(json.children[0].type).toBe('div')
  expect(json.children[0].children[0].type).toBe('h2')
  expect(json.children[0].children[0].children[0]).toBe('Hello')
  expect(json.children[1].type).toBe('div')
  expect(json.children[1].children[0]).toBe('Text')
})

test('handles string children', () => {
  const Card = macro({ Heading })(({ Heading }) => (
    <div>
      {Heading}
      Hello text
    </div>
  ))
  const json = TestRenderer.create(
    <Card>
      <Card.Heading>Hi</Card.Heading>
    </Card>
  ).toJSON()
  expect(json.children[1]).toBe('Hello text')
})

test('updates template on children update', () => {
  const Card = macro({
    Heading,
    Subhead: Heading
  })(({ Heading, Subhead }) => (
    <div>
      {Heading}
      {Subhead}
    </div>
  ))
  const card = TestRenderer.create(
    <Card>
      <Card.Heading>Nope</Card.Heading>
      <Card.Subhead>Umm</Card.Subhead>
    </Card>
  )
  const first = card.toJSON()
  expect(first.children[0].type).toBe('h2')
  expect(first.children[0].children[0]).toBe('Nope')
  expect(first.children[1].children[0]).toBe('Umm')
  card.update(
    <Card>
      <Card.Heading>Hello</Card.Heading>
      <Card.Subhead>Beep</Card.Subhead>
    </Card>
  )
  const next = card.toJSON()
  expect(next.children[0].type).toBe('h2')
  expect(next.children[0].children[0]).toBe('Hello')
  expect(next.children[1].type).toBe('h2')
  expect(next.children[1].children[0]).toBe('Beep')
})

test('skips template update', () => {
  const Card = macro({
    Heading
  })(({ Heading }) => (
    <div>
      {Heading}
    </div>
  ))
  const children = (
    <Card.Heading>Hello</Card.Heading>
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
  expect(json.children[0].type).toBe('h2')
  expect(json.children[0].children[0]).toBe('Hello')
})

test('Clone returns a cloned element', () => {
  const el = <Heading>Hello</Heading>
  const json = TestRenderer.create(
    <Clone
      element={el}
      fontSize={4}
      color='tomato'
    />
  ).toJSON()
  expect(json.type).toBe('h2')
  expect(json.props.fontSize).toBe(4)
  expect(json.props.color).toBe('tomato')
})

test('Clone returns false with no element', () => {
  const json = TestRenderer.create(
    <Clone
      fontSize={4}
      color='tomato'
    />
  ).toJSON()
  expect(json).toBe(null)
})

test('handles nested macro components', () => {
  const Inner = macro({
    Text
  })(({ Text }) => (
    <Box>
      {Text}
    </Box>
  ))

  const Outer = macro({
    Inner,
    Heading
  })(({ Inner, Heading }) => (
    <Box>
      {Heading}
      {Inner}
    </Box>
  ))

  const json = TestRenderer.create(
    <Outer>
      <Outer.Heading>Title</Outer.Heading>
      <Outer.Inner>
        <Inner.Text>Nested Content</Inner.Text>
      </Outer.Inner>
    </Outer>
  ).toJSON()

  expect(json.type).toBe('div')
  expect(json.children[0].type).toBe('h2')
  expect(json.children[0].children[0]).toBe('Title')
  expect(json.children[1].type).toBe('div')
  expect(json.children[1].children[0].type).toBe('div')
  expect(json.children[1].children[0].children[0]).toBe('Nested Content')
})
