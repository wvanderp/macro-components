import React, { ReactNode, ReactElement } from 'react'

type BaseMacroComponentType = React.ComponentType<any> & {
  macroName?: string
}

/** Map of component names to their React component types */
type ComponentsMap = Record<string, BaseMacroComponentType>

/** Props interface for Macro components */
interface MacroProps {
  children?: ReactNode
  [key: string]: any
}

/** Type definition for a Macro component with attached subcomponents */
type MacroComponentType<T extends ComponentsMap> = React.FC<MacroProps> & {
  [K in keyof T]: T[K]
} & {
  isMacroComponent: boolean
}

/** Template function type for rendering macro components */
type TemplateFunction = (
  elements: Record<string, ReactElement | undefined>,
  props: MacroProps
) => ReactNode

/**
 * Converts raw components (string or component) to React components
 * @param rawComponents Object containing component mappings
 */
const convertToComponentsMap = (
  rawComponents: Record<string, React.ComponentType<any> | string>
): ComponentsMap => {
  return Object.entries(rawComponents).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string'
      ? (props: any) => React.createElement(value, props)
      : value
    acc[key].macroName = key
    return acc
  }, {} as ComponentsMap)
}

/**
 * Creates a macro component factory
 * @param rawComponents Map of component names to their implementations
 * @returns A function that creates macro components from templates
 */
export const macro = <T extends ComponentsMap>(
  rawComponents: Record<string, React.ComponentType<any> | string>
) => {
  const components: ComponentsMap = convertToComponentsMap(rawComponents)
  const componentKeys = Object.keys(components)

  /**
   * Creates a macro component from a template function
   * @param template Function that defines how to render the macro component
   * @returns A macro component class with attached subcomponents
   */
  return (template: TemplateFunction): MacroComponentType<T> => {
    class MacroComponent extends React.Component<
      MacroProps,
      { elements: Record<string, ReactElement[] | undefined> }
    > {
      static isMacroComponent: boolean
      
      /**
       * Validates that children are valid macro components
       */
      static propTypes = {
        children: (props: MacroProps, name: string) => {
          const children = React.Children.toArray(props.children)
          for (const child of children) {
            const element = child as ReactElement
            if (!element || !element.type) {
              throw new Error(`Invalid child component: received ${element}. Must be a valid React element.`)
            }
            const key = typeof element.type === 'function'
              ? (element.type as BaseMacroComponentType).macroName
              : element.type
            if (!key || !componentKeys.includes(key)) {
              throw new Error(
                `Invalid child component: ${element.type}. Must be one of: ${componentKeys.join(', ')}`
              )
            }
          }
          return null
        }
      }

      constructor(props: MacroProps) {
        super(props)
        this.state = {
          elements: this.getElements(props.children)
        }
      }

      /**
       * Converts child elements to a map of named elements
       */
      private parseChildren(children: ReactNode): Record<string, ReactElement[] | undefined> {
        return React.Children.toArray(children)
          .reduce((acc, child) => {
            const element = child as ReactElement;
            if (!element || !element.type) {
              throw new Error(`Invalid child component: received ${element}. Must be a valid React element.`)
            }
            const key = typeof element.type === 'function'
              ? (element.type as BaseMacroComponentType).macroName
              : element.type
            if (!key || !componentKeys.includes(key)) {
              throw new Error(
                `Invalid child component: ${element.type}. Must be one of: ${componentKeys.join(', ')}`
              )
            }
            if (!acc[key]) {
              acc[key] = []
            }
            acc[key].push(element)
            return acc
          }, {} as Record<string, ReactElement[] | undefined>)
      }

      /**
       * Creates a complete element map from children
       */
      private getElements(children: ReactNode): Record<string, ReactElement[] | undefined> {
        const parsedChildren = this.parseChildren(children)
        return componentKeys.reduce((acc, key) => {
          acc[key] = parsedChildren[key]
          return acc
        }, {} as Record<string, ReactElement[] | undefined>)
      }

      UNSAFE_componentWillReceiveProps(nextProps: MacroProps) {
        if (nextProps.children === this.props.children) return
        this.setState({ elements: this.getElements(nextProps.children) })
      }

      render() {
        return template(this.state.elements, this.props)
      }
    }

    // Attach component references
    for (const key in components) {
      MacroComponent[key] = Object.assign(
        (props: any) => React.createElement(components[key], props),
        { macroName: key }
      )
    }

    MacroComponent.isMacroComponent = true

    return MacroComponent as unknown as MacroComponentType<T>
  }
}

/**
 * Clones a React element with merged props
 */
export const Clone = (props: { element?: ReactElement } & Record<string, any>) =>
  props.element
    ? React.cloneElement(props.element, { ...props, ...props.element.props })
    : null

export default macro
