import get_env from '../../get_env'

export const createUrl = async key => {
   const S3_BUCKET = await get_env('S3_BUCKET')
   return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`
}
