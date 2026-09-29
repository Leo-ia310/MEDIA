from vercel_function import auth_handler


async def register(store, payload):
    return await store.register(payload)


handler = auth_handler(register)
