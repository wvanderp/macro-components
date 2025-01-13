import React, { ReactNode, ReactElement } from 'react'

type ComponentsMap = Record<string, React.ComponentType<any>>

interface MacroProps {
  children?: ReactNode
  [key: string]: any
}

// New type definitions
type MacroComponentType<T extends ComponentsMap> = React.ComponentClass<MacroProps> & {
  [K in keyof T]: T[K]
} & {
  isMacroComponent: boolean
}

type TemplateFunction = (
  elements: Record<string, ReactElement | undefined>,
  props: MacroProps
) => ReactNode

export const macro = <T extends ComponentsMap>(rawComponents: Record<string, React.ComponentType<any> | string>) => {
  // Convert string elements to components
  const components: ComponentsMap = Object.entries(rawComponents).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' 
      ? (props: any) => React.createElement(value, props)
      : value
    return acc
  }, {} as ComponentsMap)

  return (template: TemplateFunction): MacroComponentType<T> => {
    const componentKeys = Object.keys(components)

    class MacroComponent extends React.Component<
      MacroProps,
      { elements: Record<string, ReactElement | undefined> }
    > {
      static isMacroComponent: boolean;
      static propTypes = {
        children: (props, name) => {
          const children = React.Children.toArray(props.children)
          for (let i = 0; i < children.length; i++) {
            const child = children[i]

            if (components.hasOwnProperty(child.type.macroName)) continue

            return new Error(`Invalid child component \`${child.type}\`. Must be one of: ${componentKeys.join(', ')}`)
          }
        }
      }

      constructor (props: MacroProps) {
        super(props)
        this.state = {
          elements: this.getElements(props.children)
        }
      }

      parseChildren(children: ReactNode) {
        return React.Children.toArray(children)
          .reduce((a, child) => {
            const element = child as ReactElement
            a[element.type.macroName] = element
            return a
          }, {} as Record<string, ReactElement | undefined>)
      }

      getElements(anyChildren: ReactNode) {
        const children = this.parseChildren(anyChildren)
        return componentKeys
          .reduce((a, key) => {
            a[key] = children[key]
            return a
          }, {} as Record<string, ReactElement | undefined>)
      }

      UNSAFE_componentWillReceiveProps (next: MacroProps) {
        if (next.children === this.props.children) return
        const elements = this.getElements(next.children)
        this.setState({ elements })
      }

      render () {
        const { elements } = this.state

        return template(elements, this.props)
      }
    }

    for (const key in components) {
      // cloned to keep multiple components mapped properly
      MacroComponent[key] = (props: any) => React.createElement(components[key], props)
      MacroComponent[key].macroName = key
    }

    MacroComponent.isMacroComponent = true

    // Cast the component to include the static properties
    return MacroComponent as MacroComponentType<T>
  }
}

export const Clone = (props: { element?: ReactElement } & Record<string, any>) =>
  props.element
    ? React.cloneElement(props.element, { ...props, ...props.element.props })
    : null

export default macro
