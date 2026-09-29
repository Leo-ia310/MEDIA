from vercel_function import auth_handler


async def login(store, payload):
    return await store.login(payload)


handler = auth_handler(login)
