import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import MentionList from './mention-list'
import api from '@/lib/api'

export default {
    items: async ({ query }: { query: string }) => {
        try {
            // If query is empty, we still want to fetch recent projects (handled by backend)
            const url = query ? `/projects/search?q=${query}` : '/projects/search?q=';
            const res = await api.get(url)
            return res.data
        } catch (e) {
            return []
        }
    },

    render: () => {
        let component: any
        let popup: any

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
            },

            onUpdate(props: any) {
                component.updateProps(props)

                if (!props.clientRect) {
                    return
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide()

                    return true
                }

                if (!component) return false
                return component.ref?.onKeyDown(props)
            },

            onExit() {
                popup[0].destroy()
                component.destroy()
            },
        }
    },
}
