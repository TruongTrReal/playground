import screenshot from 'screenshot-desktop';
import sizeOf from 'image-size';
export async function getResolution() {
    const { width, height } = sizeOf(await screenshot());
    if (width === undefined || height === undefined) {
        throw new Error('Could not determine screen resolution');
    }
    return { width, height };
}
