#ifndef LINKED_LIST_H
#define LINKED_LIST_H

// #define STRICT_LINKED_LIST

#define LL_PUSH_HEAD(head, item) \
    (item)->next = (head); \
    (head) = (item)

#define LL_REMOVE_ITEM(head, item, prev) \
    if (prev) { \
        (prev)->next = (item)->next; \
    } else { \
        (head) = (item)->next; \
    }

#define LL_REMOVE_HEAD(head) \
    if (head) { \
        (head) = (head)->next; \
    }

#define DL_PUSH_HEAD(head, item) \
    (item)->prev = 0; \
    (item)->next = (head); \
    if (head) { \
        (head)->prev = (item); \
    } \
    (head) = (item)

#ifdef STRICT_LINKED_LIST
#define DL_REMOVE_ITEM(head, item) \
    if (head) { \
        /* Hook next to prev */ \
        if ((item)->next && (item)->prev) \
        { \
            /* Middle of list */ \
            (item)->prev->next = (item)->next; \
            (item)->next->prev = (item)->prev; \
        } \
        else if ((item)->next) \
        { \
            /* Start of list */ \
            (item)->next->prev = 0; \
            (head) = (item)->next; \
        } \
        else if ((item)->prev) \
        { \
            /* End of list */ \
            (item)->prev->next = 0; \
        } \
        else \
        { \
            (head) = 0; \
        } \
        (item)->next = (item)->prev = 0; \
    }
#else
#define DL_REMOVE_ITEM(head, item) \
    /* Hook next to prev */ \
    if ((item)->next && (item)->prev) \
    { \
        /* Middle of list */ \
        (item)->prev->next = (item)->next; \
        (item)->next->prev = (item)->prev; \
    } \
    else if ((item)->next) \
    { \
        /* Start of list */ \
        (item)->next->prev = 0; \
        (head) = (item)->next; \
    } \
    else if ((item)->prev) \
    { \
        /* End of list */ \
        (item)->prev->next = 0; \
    } \
    else \
    { \
        (head) = 0; \
    }
#endif

#define DL_CONTAINS(head_mut, item, found) \
    (found) = 0; \
    while (head_mut) { \
        if ((head_mut) == (item)) \
        { \
            (found) = 1; \
            break; \
        } \
        (head_mut) = (head_mut)->next; \
    }

#endif
