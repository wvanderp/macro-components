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

describe('macro-components', () => {
  describe('basic functionality', () => {
    test('creates a valid React component', () => {
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
      expect(Card.isMacroComponent).toBe(true)
    })

    test('renders with correct structure', () => {
      const Card = macro({
        h1: 'h1',
        div: 'div'
      })(({ h1, div }) => (
        <div data-testid="card">
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
  })

  describe('component composition', () => {
    test('correctly composes with React components', () => {
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

    test('handles deeply nested macro components', () => {
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

    test('handles multiple instances of the same component type', () => {
      const List = macro({
        Item: Box
      })(({ Item }) => (
        <div>
          {React.Children.toArray(Item)}
        </div>
      ))

      const json = TestRenderer.create(
        <List>
          <List.Item>First</List.Item>
          <List.Item>Second</List.Item>
        </List>
      ).toJSON()

      expect(json.type).toBe('div')
      const children = json.children
      expect(children[0].children[0]).toBe('First')
      expect(children[1].children[0]).toBe('Second')
    })
  })

  describe('error handling', () => {
    test('throws error for invalid child components', () => {
      const Card = macro({
        Header: 'header'
      })(({ Header }) => <div>{Header}</div>)

      expect(() => {
        TestRenderer.create(
          <Card>
            <Card.INVALID>Hello</Card.INVALID>
          </Card>
        )
      }).toThrowErrorMatchingSnapshot()
    })

    test('handles missing children gracefully', () => {
      const Card = macro({
        Header: 'header',
        Body: 'div'
      })(({ Header, Body }) => (
        <div>
          {Header}
          {Body}
        </div>
      ))

      const json = TestRenderer.create(<Card />).toJSON()
      expect(json).toMatchSnapshot()
    })
  })

  describe('Clone component', () => {
    test('correctly merges props when cloning', () => {
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

    test('handles undefined element gracefully', () => {
      const json = TestRenderer.create(
        <Clone
          fontSize={4}
          color='tomato'
        />
      ).toJSON()
      expect(json).toBe(null)
    })

    test('preserves original props when cloning', () => {
      const el = <Heading className="original">Hello</Heading>
      const json = TestRenderer.create(
        <Clone
          element={el}
          className="new"
          data-test="value"
        />
      ).toJSON()
      
      expect(json.props.className).toBe('original')
      expect(json.props['data-test']).toBe('value')
    })
  })
})
