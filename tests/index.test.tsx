import { describe, it, expect } from 'vitest'
import React from 'react'
import TestRenderer from 'react-test-renderer'
import { macro, Clone } from '../src/index'

// Mock components for testing
const mockComponents = {
  Header: 'header',
  Footer: 'footer',
  Content: 'div',
  Sidebar: 'aside'
}

describe('convertToComponentsMap', () => {
  it('should convert raw components to React components', () => {
    const componentsMap = macro(mockComponents)
    expect(componentsMap).toBeInstanceOf(Function)
  })

  it('should handle both string and component types', () => {
    const CustomComponent = () => <div>Custom</div>
    const mixed = {
      ...mockComponents,
      Custom: CustomComponent
    }
    const factory = macro(mixed)
    expect(factory).toBeInstanceOf(Function)
  })
})

describe('macro', () => {
  it('should create a macro component factory', () => {
    const factory = macro(mockComponents)
    expect(factory).toBeInstanceOf(Function)
  })

  it('should create a macro component from a template function', () => {
    const factory = macro(mockComponents)
    const template = () => <div>Template</div>
    const MacroComponent = factory(template)
    expect(MacroComponent.isMacroComponent).toBe(true)
  })

  it('should pass props to template function', () => {
    const factory = macro(mockComponents)
    const template = (elements: any, props: any) => <div data-testid="test">{props.text}</div>
    const MacroComponent = factory(template)
    const renderer = TestRenderer.create(<MacroComponent text="Hello" />)
    const instance = renderer.root
    expect(instance.findByProps({ 'data-testid': 'test' }).children[0]).toBe('Hello')
  })

  it('should properly compose nested components', () => {
    const factory = macro(mockComponents)
    const template = (elements: any) => (
      <div data-testid="container">
        {elements.Header?.[0]}
        {elements.Content?.[0]}
        {elements.Footer?.[0]}
      </div>
    )
    const MacroComponent = factory(template)
    const renderer = TestRenderer.create(
      <MacroComponent>
        <MacroComponent.Header>Header</MacroComponent.Header>
        <MacroComponent.Content>Content</MacroComponent.Content>
        <MacroComponent.Footer>Footer</MacroComponent.Footer>
      </MacroComponent>
    )
    const instance = renderer.root

    expect(instance.findByType('header')).toBeTruthy()
    expect(instance.findByType('div')).toBeTruthy()
    expect(instance.findByType('footer')).toBeTruthy()
  })

  it('should handle multiple instances of same child component', () => {
    const factory = macro(mockComponents)
    const template = (elements: any) => (
      <div data-testid="container">
        {elements.Content?.map((content, i) => (
          <div key={i} data-testid={`content-${i}`}>{content}</div>
        ))}
      </div>
    )
    const MacroComponent = factory(template)
    const renderer = TestRenderer.create(
      <MacroComponent>
        <MacroComponent.Content>First</MacroComponent.Content>
        <MacroComponent.Content>Second</MacroComponent.Content>
      </MacroComponent>
    )
    const instance = renderer.root
    
    const contents = instance.findAll(node => node.props['data-testid'] && node.props['data-testid'].startsWith('content-'))
    expect(contents).toHaveLength(2)
  })
})

describe('Clone', () => {
  it('should return null if no element is provided', () => {
    const clonedElement = Clone({})
    expect(clonedElement).toBeNull()
  })

  it('should preserve children of cloned element', () => {
    const element = <div><span>Child</span></div>
    const cloned = Clone({ element })
    expect(cloned.props.children).toEqual(<span>Child</span>)
  })
})
