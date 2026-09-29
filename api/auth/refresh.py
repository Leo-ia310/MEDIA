from vercel_function import auth_handler


async def refresh(store, payload):
    return await store.refresh_session(refresh_token=payload.refresh_token)


handler = auth_handler(refresh)
