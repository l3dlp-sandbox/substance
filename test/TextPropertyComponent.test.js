import { test } from 'substance-test'
import { TextPropertyComponent } from 'substance'
import { getMountPoint } from './shared/testHelpers'
import createTestArticle from './shared/createTestArticle'
import getTestConfig from './shared/getTestConfig'
import simple from './fixture/simple'
import setupEditor from './shared/setupEditor'

test('TextPropertyComponent: Get coordinate of empty property', t => {
  let doc = createTestArticle(simple)
  doc.create({
    type: 'paragraph',
    id: 'empty',
    content: ''
  })
  let comp = TextPropertyComponent.mount({
    doc: doc,
    path: ['empty', 'content']
  }, getMountPoint(t))

  let coor = comp.getDOMCoordinate(0)

  t.notNil(coor, 'Coordinate should be not null.')
  t.equal(coor.container, comp.el.getNativeElement(), 'element should be property element')
  t.equal(coor.offset, 0, 'offset should be 0')
  t.end()
})

test('TextPropertyComponent: Get coordinate if cursor is inside inline-node', t => {
  let { surface, doc } = setupEditor(t, (doc, body) => {
    let p1 = doc.create({
      type: 'paragraph',
      id: 'p1',
      content: 'ab x cd'
    })
    doc.create({
      type: 'test-inline-node',
      id: 'in1',
      content: 'foo',
      start: {
        path: p1.getPath(),
        offset: 3
      },
      end: {
        offset: 4
      }
    })
    body.append(p1)
  })
  let p1 = doc.get('p1')
  let in1Comp = surface.find('[data-id=in1]')
  let coor = TextPropertyComponent.getCoordinate(surface.getElement(), in1Comp.getElement(), 1)
  t.deepEqual(coor.toJSON(), { path: p1.getPath(), offset: 4 })
  t.end()
})
