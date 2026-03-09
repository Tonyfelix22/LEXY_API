import threading

_thread_locals = threading.local()

def set_current_user(user):
    """
    Sets the current user in thread local storage.
    """
    _thread_locals.user = user

def get_current_user():
    """
    Gets the current user from thread local storage.
    Returns None if no user is set.
    """
    return getattr(_thread_locals, 'user', None)

def clear_current_user():
    """
    Clears the current user from thread local storage.
    """
    if hasattr(_thread_locals, 'user'):
        del _thread_locals.user
